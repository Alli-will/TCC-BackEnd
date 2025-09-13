import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly userService: UserService,
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
    // Última pesquisa de pulso da empresa.
    // 1) Tenta dentro do escopo da empresa (companyId preenchido)
    let ultimaPesquisaPulso = await this.prisma.search.findFirst({
      where: { tipo: 'pulso', companyId },
      orderBy: { createdAt: 'desc' },
    });
    if (!ultimaPesquisaPulso) {
      ultimaPesquisaPulso = await this.prisma.search.findFirst({
        where: { tipo: 'pulso', companyId: null },
        orderBy: { createdAt: 'desc' },
      });
    }

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
      where: {
        pesquisaId: ultimaPesquisaPulso.id,
        // Garante isolamento: só respostas de usuários da empresa atual
        user: { companyId },
      },
      include: { user: { include: { department: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // eNPS no dashboard: apenas a PRIMEIRA pergunta da última pesquisa, resposta mais recente por usuário
    interface ColabNps { id: number; nome: string; departamento: string; nota: number; categoria: 'promotor' | 'neutro' | 'detrator'; createdAt: Date; }
    const latestByUser: Record<number, ColabNps> = {};
    pulseResponses.forEach(resp => {
      const user = resp.user as any;
      const uid = user.id;
      if (latestByUser[uid]) return; 
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

    // Departamentos: computar eNPS por departamento (somente com respondentes)
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

  @Get('metrics/raw')
  @Roles(UserRole.ADMIN)
  async getDashboardMetricsRaw(@Req() req: any) {
    const companyId = req.user?.companyId;
    let ultimaPesquisaPulso = await this.prisma.search.findFirst({
      where: { tipo: 'pulso', companyId },
      orderBy: { createdAt: 'desc' },
    });
    if (!ultimaPesquisaPulso) {
      ultimaPesquisaPulso = await this.prisma.search.findFirst({
        where: { tipo: 'pulso', companyId: null },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (!ultimaPesquisaPulso) return { pulsoAtual: null, responses: [] };
    const pulseResponses = await this.prisma.pulseResponse.findMany({
      where: { pesquisaId: ultimaPesquisaPulso.id, user: { companyId } },
      include: { user: { select: { id: true, first_Name: true, last_Name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = pulseResponses.map(r => {
      let firstScore: any = undefined;
      try {
        const arr = Array.isArray(r.answers) ? r.answers : (r.answers as any);
        firstScore = arr?.[0]?.resposta;
      } catch {}
      return {
        responseId: r.id,
        userId: r.user?.id,
        userName: `${r.user?.first_Name || ''} ${r.user?.last_Name || ''}`.trim(),
        firstScore,
        createdAt: r.createdAt,
        companyId: r.companyId,
      };
    });
    // Identificar duplicados por usuário
    const duplicates: Record<string, any[]> = {};
    mapped.forEach(m => {
      if (!m.userId) return;
      if (!duplicates[m.userId]) duplicates[m.userId] = [];
      duplicates[m.userId].push(m);
    });
    Object.keys(duplicates).forEach(k => {
      if (duplicates[k].length < 2) delete duplicates[k];
    });
    return { pulsoAtual: { id: ultimaPesquisaPulso.id, titulo: ultimaPesquisaPulso.titulo }, totalRaw: mapped.length, duplicates, responses: mapped };
  }

  async getEssScore(userId: number): Promise<{ ess: number, valores: number[], emotions: string[] }> {
    // Recomputar ESS a partir das respostas do pulso (últimos 30 dias)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const responses = await this.prisma.pulseResponse.findMany({
      where: { createdAt: { gte: since }, userId },
      orderBy: { createdAt: 'desc' },
      select: { answers: true },
    });
    const valores: number[] = [];
    const emotions: string[] = [];
    responses.forEach(r => {
      try {
        const arr = Array.isArray(r.answers) ? r.answers : (r.answers as any);
        const v = arr?.[0]?.resposta; // usar a primeira pergunta do pulso (eNPS 0..10)
        if (typeof v === 'number' && v >= 0 && v <= 10) valores.push(v);
      } catch {}
    });
    const soma = valores.reduce((acc, d) => acc + d, 0);
    const media = valores.length ? soma / valores.length : 0;
    const ess = Math.round((media / 10) * 100);
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
    const media = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const ess = Math.round((media / 10) * 100);
    return { ess, valores: scores };
  }
}
