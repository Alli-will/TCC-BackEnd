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
  async getDashboardMetrics() {
    // NOVA LÓGICA: basear métricas em respostas de pesquisas tipo "pulso" (NPS 0-10)
    // Obtém usuários (exclui suporte já aplicado no serviço) e respostas de pulso (últimos 30 dias)
    const users = await this.userService.findAll();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const pulseResponses = await this.prisma.pulseResponse.findMany({
      where: { createdAt: { gte: since } },
      include: { user: { include: { department: true } } },
    });

    // Cada resposta possui answers: Json => array de { resposta: number }
    // NPS por colaborador: usar a PRIMEIRA pergunta (recomendaria a empresa) como driver principal
    interface ColabMetric { id: number; nome: string; departamento: string; npsDriverScore: number | null; categoria: 'promotor' | 'neutro' | 'detrator' | null; }

    const byUser: Record<number, ColabMetric> = {};
    pulseResponses.forEach(resp => {
      // pegar score da primeira resposta
      let score: number | null = null;
      try {
        const arr = Array.isArray(resp.answers) ? resp.answers : (resp.answers as any);
        if (Array.isArray(arr) && arr.length && typeof arr[0].resposta === 'number') {
          score = arr[0].resposta;
        }
      } catch (e) {}
      const user = resp.user as any;
      const nome = `${user.first_Name || ''} ${user.last_Name || ''}`.trim();
      const departamento = user?.department?.name || 'Sem departamento';
      if (!byUser[user.id]) {
        byUser[user.id] = { id: user.id, nome, departamento, npsDriverScore: score, categoria: null };
      } else {
        // se já existia e ainda não tinha score, preenche
        if (byUser[user.id].npsDriverScore == null && score != null) byUser[user.id].npsDriverScore = score;
      }
    });

    // Classificar categorias NPS
    Object.values(byUser).forEach(c => {
      if (c.npsDriverScore == null) return;
      if (c.npsDriverScore >= 9) c.categoria = 'promotor';
      else if (c.npsDriverScore >= 7) c.categoria = 'neutro';
      else c.categoria = 'detrator';
    });

    const colaboradores = Object.values(byUser).filter(c => c.npsDriverScore != null);
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
        npsDriverScore: c.npsDriverScore,
        categoria: c.categoria,
      })),
      departamentos,
      colaboradoresEmRisco: colaboradoresCriticos.map(c => ({
        id: c.id,
        nome: c.nome,
        departamento: c.departamento,
        // risco derivado: detrator
        categoria: c.categoria,
      })),
    };
  }

  async getEssScore(userId: number): Promise<{ ess: number, valores: number[], emotions: string[] }> {
    // Buscar apenas os últimos 30 dias
    const entries = await this.diaryService.findEntriesByUserId(userId, 30);
    console.log('ESS DEBUG RAW ENTRIES:', JSON.stringify(entries, null, 2));
    console.log('Datas usadas no ESS (últimos 30 dias):', entries.map(e => e.date || e.created_at));
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
    console.log('ESS DEBUG -> Soma:', soma, '| Média:', media, '| ESS:', ess, '| Valores:', valores);
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
  async getEssGeral() {
    // AGORA reinterpreta ESS geral como NPS geral (para compatibilidade de front até ajuste)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const pulseResponses = await this.prisma.pulseResponse.findMany({ where: { createdAt: { gte: since } } });
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
