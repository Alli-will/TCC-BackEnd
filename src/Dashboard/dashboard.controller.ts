import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserService } from '../user/user.service';
import { DiaryService } from '../DiaryEntry/Diary/diary.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly userService: UserService,
    private readonly diaryService: DiaryService, // mantido temporariamente para endpoint legacy ESS por usuário
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  getDashboard() {
    // lógica do dashboard
    return { message: 'Acesso permitido apenas para admin' };
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN)
  async getDashboardMetrics(@Req() req: any) {
    const companyId = req.user?.companyId;
    // Restringe usuários à empresa
    const users = await this.userService.findAll(companyId);
    // Última pesquisa de pulso da empresa (se campo companyId for adicionado futuramente)
    const ultimaPesquisaPulso = await this.prisma.search.findFirst({
      where: { tipo: 'pulso' }, // TODO: adicionar filtro companyId quando campo existir
      orderBy: { createdAt: 'desc' },
    });

    if (!ultimaPesquisaPulso) {
      return {
        metricas: { ativos: users.length, respondentes: 0, nps: 0, promotores: 0, detratores: 0, neutros: 0, promotoresPercent: 0, detratoresPercent: 0 },
        colaboradores: [],
        departamentos: [],
        colaboradoresEmRisco: [],
        pulsoAtual: null,
      };
    }

    const pulseResponses = await this.prisma.pulseResponse.findMany({
      where: { pesquisaId: ultimaPesquisaPulso.id, user: { companyId } },
      include: { user: { include: { department: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // NPS CLÁSSICO no dashboard: apenas a PRIMEIRA pergunta (nota de recomendação) da última pesquisa, resposta mais recente por usuário
    interface ColabNps { id: number; nome: string; departamento: string; nota: number; categoria: 'promotor' | 'neutro' | 'detrator'; createdAt: Date; }
    const latestByUser: Record<number, ColabNps> = {};
    pulseResponses.forEach(resp => {
      const user = resp.user as any;
      const uid = user.id;
      if (latestByUser[uid]) return; // já temos a resposta mais recente (lista está ordenada desc)
      let arr: any[] = [];
      try { arr = Array.isArray(resp.answers) ? resp.answers : (resp.answers as any); } catch { arr = []; }
      const first = arr && arr[0] ? arr[0].resposta : undefined;
      if (typeof first === 'number' && first >= 0 && first <= 10) {
        let categoria: ColabNps['categoria'];
        if (first >= 9) categoria = 'promotor';
        else if (first >= 7) categoria = 'neutro';
        else categoria = 'detrator';
        latestByUser[uid] = {
          id: uid,
            nome: `${user.first_Name || ''} ${user.last_Name || ''}`.trim(),
          departamento: user?.department?.name || 'Sem departamento',
          nota: first,
          categoria,
          createdAt: resp.createdAt,
        };
      }
    });

    const colaboradores = Object.values(latestByUser);
    const totalRespondentes = colaboradores.length;
    const promotores = colaboradores.filter(c => c.categoria === 'promotor').length;
    const detratores = colaboradores.filter(c => c.categoria === 'detrator').length;
    const nps = totalRespondentes ? Math.round(((promotores / totalRespondentes) - (detratores / totalRespondentes)) * 100) : 0;

    // Departamentos: computar NPS por departamento (somente com respondentes)
    const deptMap: Record<string, { prom: number; det: number; total: number }> = {};
    colaboradores.forEach(c => {
      const dept = c.departamento || 'Sem departamento';
      if (!deptMap[dept]) deptMap[dept] = { prom: 0, det: 0, total: 0 };
      deptMap[dept].total++;
      if (c.categoria === 'promotor') deptMap[dept].prom++;
      if (c.categoria === 'detrator') deptMap[dept].det++;
    });
    const departamentos = Object.entries(deptMap).map(([nome, v]) => {
      const deptNps = v.total ? Math.round(((v.prom / v.total) - (v.det / v.total)) * 100) : 0;
      return { nome, nps: deptNps, respondentes: v.total };
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    // Colaboradores críticos (detratores)
  const colaboradoresCriticos = colaboradores.filter(c => c.categoria === 'detrator');

    const metricas = {
      ativos: users.length,
      respondentes: totalRespondentes,
      nps,
      promotores,
      detratores,
      neutros: colaboradores.filter(c => c.categoria === 'neutro').length,
      promotoresPercent: totalRespondentes ? Math.round((promotores / totalRespondentes) * 100) : 0,
      detratoresPercent: totalRespondentes ? Math.round((detratores / totalRespondentes) * 100) : 0,
    };

    return {
      metricas,
      colaboradores: colaboradores.map(c => ({
        id: c.id,
        nome: c.nome,
        departamento: c.departamento,
        npsDriverScore: c.nota,
        categoria: c.categoria,
        answersCount: 1
      })),
      departamentos,
      colaboradoresEmRisco: colaboradoresCriticos.map(c => ({
        id: c.id,
        nome: c.nome,
        departamento: c.departamento,
        categoria: c.categoria,
      })),
      pulsoAtual: { id: ultimaPesquisaPulso.id, titulo: ultimaPesquisaPulso.titulo, createdAt: ultimaPesquisaPulso.createdAt },
    };
  }

  async getEssScore(userId: number): Promise<{ ess: number, valores: number[], emotions: string[] }> {
    // Buscar apenas os últimos 30 dias
    const entries = await this.diaryService.findEntriesByUserId(userId, 30);
    if (!entries || entries.length === 0) return { ess: 0, valores: [], emotions: [] };
    const emotionEssScore: { [key: string]: number } = {
      'Muito bem': 5,
      'Bem': 4,
      'Neutro': 3,
      'Mal': 2,
      'Muito mal': 1
    };
    const valores: number[] = [];
    const emotions: string[] = [];
    entries.forEach((d: any) => {
      if (typeof d.bemEstar === 'number') {
        valores.push(d.bemEstar);
        emotions.push('bemEstar');
      } else if (typeof d.emotion === 'string') {
        const emo = d.emotion; // Removido .toLowerCase()
        valores.push(emotionEssScore[emo] ?? 3);
        emotions.push(emo);
      }
    });
    const soma = valores.reduce((acc: number, d: number) => acc + d, 0);
    const media = valores.length > 0 ? soma / valores.length : 0;
    const ess = Math.round((media / 5) * 100);
    return { ess, valores, emotions };
  }

  @Get('ess')
  @UseGuards(JwtAuthGuard)
  async getUserEss(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id;
    const { ess, valores, emotions } = await this.getEssScore(userId);
    return { ess, valores, emotions };
  }

  @Get('ess-geral')
  @Roles(UserRole.ADMIN)
  async getEssGeral(@Req() req: any) {
    const companyId = req.user?.companyId;
    // AGORA reinterpreta ESS geral como NPS geral (para compatibilidade de front até ajuste)
    const since = new Date();
    since.setDate(since.getDate() - 30);
  const pulseResponses = await this.prisma.pulseResponse.findMany({ where: { createdAt: { gte: since }, user: { companyId } } });
    const scores: number[] = [];
    pulseResponses.forEach(r => {
      try {
        const arr = Array.isArray(r.answers) ? r.answers : (r.answers as any);
        if (Array.isArray(arr) && arr.length && typeof arr[0].resposta === 'number') scores.push(arr[0].resposta);
      } catch (e) {}
    });
    // converter média 0-10 para percentual (como antigo ESS) apenas para não quebrar tela existente
    const media = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const ess = Math.round((media / 10) * 100);
    return { ess, valores: scores };
  }
}
