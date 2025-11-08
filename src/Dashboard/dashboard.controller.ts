import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
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
  async getDashboardMetrics(@Req() req: any, @Query() query: any) {
    const companyId = req.user?.companyId;
    // Filtro de período opcional: ?days=90 ou ?since=YYYY-MM-DD&until=YYYY-MM-DD
    let sinceDate: Date | undefined;
    let untilDate: Date | undefined;
    try {
      if (query?.days) {
        const n = Number(query.days);
        if (!isNaN(n) && n > 0) {
          sinceDate = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
        }
      }
      if (query?.since) {
        const d = new Date(query.since);
        if (!isNaN(d.getTime())) sinceDate = d;
      }
      if (query?.until) {
        const d = new Date(query.until);
        if (!isNaN(d.getTime())) untilDate = d;
      }
    } catch {}
    // Restringe usuários à empresa
    const users = await this.userService.findAll(companyId);
    // Agregado: considera TODAS as pesquisas de pulso (ativas) e usa a resposta mais recente por usuário no conjunto.
    // Como não há um campo de status/encerramento, "ativas" aqui significa todas as pesquisas existentes; o filtro por empresa é feito via usuário.
    // Filtro de período agora aplicado na data de criação da pesquisa (search.createdAt)
    // Busca os IDs de pesquisas de pulso dentro do período selecionado
    let surveyIdsInPeriod: number[] | null = null;
    if (sinceDate || untilDate) {
      const searchCreatedAt: any = {};
      if (sinceDate) searchCreatedAt.gte = sinceDate;
      if (untilDate) searchCreatedAt.lte = untilDate;
      const surveys = await this.prisma.search.findMany({
        where: {
          tipo: 'pulso',
          ...(sinceDate || untilDate ? { createdAt: searchCreatedAt } : {}),
        },
        select: { id: true },
      });
      surveyIdsInPeriod = surveys.map((s) => s.id);
      if (!surveyIdsInPeriod.length) {
        return {
          metricas: {
            ativos: users.length,
            respondentes: 0,
            pesquisas: 0,
            nps: 0,
            promotores: 0,
            detratores: 0,
            neutros: 0,
            promotoresPercent: 0,
            detratoresPercent: 0,
          },
          period: {
            days: query?.days ? Number(query.days) : undefined,
            since: sinceDate ? sinceDate.toISOString() : undefined,
            until: untilDate ? untilDate.toISOString() : undefined,
            filterBy: 'surveys',
          },
          colaboradores: [],
          departamentos: [],
          colaboradoresEmRisco: [],
          pulsoAtual: null,
        };
      }
    }
    const pulseResponses = await this.prisma.pulseResponse.findMany({
      where: {
        // Isolamento por empresa via usuário
        user: { companyId },
        ...(surveyIdsInPeriod ? { pesquisaId: { in: surveyIdsInPeriod } } : {}),
      },
      include: { user: { include: { department: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!pulseResponses.length) {
      return {
        metricas: {
          ativos: users.length,
          respondentes: 0,
          pesquisas: 0,
          nps: 0,
          promotores: 0,
          detratores: 0,
          neutros: 0,
          promotoresPercent: 0,
          detratoresPercent: 0,
        },
        colaboradores: [],
        departamentos: [],
        colaboradoresEmRisco: [],
        pulsoAtual: null,
      };
    }

    // Debug: visão geral do agregado
    const distinctPesquisaCount = Array.from(
      new Set(pulseResponses.map((r: any) => r.pesquisaId)),
    ).length;
    const bySurvey: Record<
      number,
      { total: number; prom: number; neu: number; det: number }
    > = {};
    for (const r of pulseResponses as any[]) {
      const sid = r.pesquisaId as number;
      if (!bySurvey[sid]) bySurvey[sid] = { total: 0, prom: 0, neu: 0, det: 0 };
      bySurvey[sid].total++;
      let score: any;
      try {
        const arr = Array.isArray(r.answers) ? r.answers : (r.answers as any);
        score = arr?.[0]?.resposta;
      } catch {}
      if (typeof score === 'number' && score >= 0 && score <= 10) {
        if (score >= 9) bySurvey[sid].prom++;
        else if (score >= 7) bySurvey[sid].neu++;
        else bySurvey[sid].det++;
      }
    }

    // Novo modo agregado: mais recente por usuário EM CADA pesquisa (não mais um único mais recente geral).
    // 1) Dedupe por (pesquisaId, userId) considerando a resposta mais recente primeiro (ordenado por createdAt desc acima)
    const pickedBySurveyUser: Record<string, any> = {};
    const selected: any[] = [];
    for (const resp of pulseResponses as any[]) {
      const uid = resp?.user?.id;
      const sid = resp?.pesquisaId;
      if (!uid || !sid) continue;
      const key = `${sid}:${uid}`;
      if (pickedBySurveyUser[key]) continue; // já temos a mais recente para este par
      pickedBySurveyUser[key] = resp;
      selected.push(resp);
    }

    // 2) Mapear para estrutura esperada pelo front (cada resposta conta como um registro)
    interface ColabNps {
      id: number;
      nome: string;
      departamento: string;
      nota: number;
      categoria: 'promotor' | 'neutro' | 'detrator';
      createdAt: Date;
    }
    const colaboradores: ColabNps[] = [];
    for (const resp of selected as any[]) {
      const user = resp.user as any;
      let arr: any[] = [];
      try {
        arr = Array.isArray(resp.answers)
          ? resp.answers
          : (resp.answers as any);
      } catch {
        arr = [];
      }
      const first = arr && arr[0] ? arr[0].resposta : undefined;
      if (typeof first !== 'number' || first < 0 || first > 10) continue;
      let categoria: ColabNps['categoria'];
      if (first >= 9) categoria = 'promotor';
      else if (first >= 7) categoria = 'neutro';
      else categoria = 'detrator';
      colaboradores.push({
        id: user?.id,
        nome: `${user?.first_Name || ''} ${user?.last_Name || ''}`.trim(),
        departamento: user?.department?.name || 'Sem departamento',
        nota: first,
        categoria,
        createdAt: resp.createdAt,
      });
    }
    const totalRespondentes = colaboradores.length; // agora é total de respostas (pós-dedupe por pesquisa)
    // Distintos IDs de pesquisa presentes nas respostas agregadas
    const pesquisaIds = Array.from(
      new Set(selected.map((r: any) => r.pesquisaId)),
    );
    // Debug: após dedupe por usuário (mais recente)
    const sample = colaboradores
      .slice(0, 10)
      .map((c: any) => ({
        userId: c.id,
        dept: c.departamento,
        nota: c.nota,
        cat: c.categoria,
      }));
    const promotores = colaboradores.filter(
      (c) => c.categoria === 'promotor',
    ).length;
    const detratores = colaboradores.filter(
      (c) => c.categoria === 'detrator',
    ).length;
    const nps = totalRespondentes
      ? Math.round(
          (promotores / totalRespondentes - detratores / totalRespondentes) *
            100,
        )
      : 0;

    // Departamentos via SQL direto (distinct por usuário; percentuais/NPS sobre total de respostas)
    const departamentos = await this.prisma.$queryRaw<any[]>`
      WITH fr AS (
        SELECT pr."userId", pr."pesquisaId", pr."createdAt",
               (pr.answers->0->>'resposta')::int AS score
        FROM "PulseResponse" pr
        JOIN "User" u ON u.id = pr."userId"
        JOIN "survey" s ON s.id = pr."pesquisaId"
        WHERE u."companyId" = ${companyId}
          AND (${sinceDate ? sinceDate : null}::timestamptz IS NULL OR s."createdAt" >= ${sinceDate ? sinceDate : null}::timestamptz)
          AND (${untilDate ? untilDate : null}::timestamptz IS NULL OR s."createdAt" <= ${untilDate ? untilDate : null}::timestamptz)
          AND (pr.answers->0->>'resposta') ~ '^[0-9]+$'
          AND (pr.answers->0->>'resposta')::int BETWEEN 0 AND 10
      )
      SELECT COALESCE(d.name, 'Sem departamento') AS nome,
             COUNT(DISTINCT fr."userId")::int                                 AS "uniqueUsers",
             SUM(CASE WHEN fr.score >= 9 THEN 1 ELSE 0 END)::int               AS promotores,
             SUM(CASE WHEN fr.score BETWEEN 7 AND 8 THEN 1 ELSE 0 END)::int    AS neutros,
             SUM(CASE WHEN fr.score <= 6 THEN 1 ELSE 0 END)::int               AS detratores,
        COUNT(*)::int                                                     AS respostas,
             CASE WHEN COUNT(*) > 0 THEN
               ROUND(((SUM(CASE WHEN fr.score >= 9 THEN 1 ELSE 0 END)::numeric / COUNT(*)) -
                     (SUM(CASE WHEN fr.score <= 6 THEN 1 ELSE 0 END)::numeric / COUNT(*))) * 100)::int
             ELSE 0 END AS nps
      FROM fr
      JOIN "User" u ON u.id = fr."userId"
      LEFT JOIN "Department" d ON d.id = u."departmentId"
      GROUP BY nome
      ORDER BY nome;
    `;

    // Evolução do eNPS (mensal, não acumulado) para os últimos 12 meses
    const evolucaoNps = await this.prisma.$queryRaw<any[]>`
      WITH meses AS (
        SELECT date_trunc('month', d)::date AS mes
        FROM generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) d
      ),
      fr AS (
        SELECT 
          pr."userId", 
          pr."pesquisaId", 
          pr."createdAt",
          date_trunc('month', pr."createdAt")::date AS mes_resposta,
          (pr.answers->0->>'resposta')::int AS score
        FROM "PulseResponse" pr
        JOIN "User" u ON u.id = pr."userId"
        JOIN "survey" s ON s.id = pr."pesquisaId"
        WHERE u."companyId" = ${companyId}
          AND pr."createdAt" >= date_trunc('month', CURRENT_DATE - INTERVAL '11 months')
          AND (pr.answers->0->>'resposta') ~ '^[0-9]+$'
          AND (pr.answers->0->>'resposta')::int BETWEEN 0 AND 10
      )
      SELECT 
        m.mes,
        TO_CHAR(m.mes, 'MM/YYYY') AS "mesFormatado",
        COUNT(DISTINCT fr."userId")::int AS "uniqueUsers",
        SUM(CASE WHEN fr.score >= 9 THEN 1 ELSE 0 END)::int AS promotores,
        SUM(CASE WHEN fr.score BETWEEN 7 AND 8 THEN 1 ELSE 0 END)::int AS neutros,
        SUM(CASE WHEN fr.score <= 6 THEN 1 ELSE 0 END)::int AS detratores,
        COUNT(fr.score)::int AS respondentes,
        CASE WHEN COUNT(fr.score) > 0 THEN
          ROUND(((SUM(CASE WHEN fr.score >= 9 THEN 1 ELSE 0 END)::numeric / COUNT(fr.score)) -
                (SUM(CASE WHEN fr.score <= 6 THEN 1 ELSE 0 END)::numeric / COUNT(fr.score))) * 100)::int
        ELSE NULL END AS nps
      FROM meses m
      LEFT JOIN fr ON fr.mes_resposta = m.mes
      GROUP BY m.mes
      ORDER BY m.mes;
    `;

    // Colaboradores críticos (detratores)
    const colaboradoresCriticos = colaboradores.filter(
      (c) => c.categoria === 'detrator',
    );

    const metricas = {
      ativos: users.length,
      respondentes: totalRespondentes,
      pesquisas: pesquisaIds.length,
      nps,
      promotores,
      detratores,
      neutros: colaboradores.filter((c) => c.categoria === 'neutro').length,
      promotoresPercent: totalRespondentes
        ? Math.round((promotores / totalRespondentes) * 100)
        : 0,
      detratoresPercent: totalRespondentes
        ? Math.round((detratores / totalRespondentes) * 100)
        : 0,
    };

    // Para manter compatibilidade com o front, retornamos a mesma estrutura; pulsoAtual vira um placeholder agregado.
    return {
      metricas,
      period: {
        days: query?.days ? Number(query.days) : undefined,
        since: sinceDate ? sinceDate.toISOString() : undefined,
        until: untilDate ? untilDate.toISOString() : undefined,
        filterBy: 'surveys',
      },
      colaboradores: colaboradores.map((c) => ({
        id: c.id,
        nome: c.nome,
        departamento: c.departamento,
        npsDriverScore: c.nota,
        categoria: c.categoria,
        answersCount: 1,
      })),
      departamentos,
      colaboradoresEmRisco: colaboradoresCriticos.map((c) => ({
        id: c.id,
        nome: c.nome,
        departamento: c.departamento,
        categoria: c.categoria,
      })),
      pulsoAtual: {
        id: 0,
        titulo: 'Agregado (todas as pesquisas de pulso)',
        createdAt: new Date(),
      },
      evolucaoNps,
    };
  }

  @Get('clima/metrics')
  @Roles(UserRole.ADMIN)
  async getClimaMetrics(@Req() req: any, @Query() query: any) {
    const companyId = req.user?.companyId;
    // Filtro de período opcional: ?days=90 ou ?since=YYYY-MM-DD&until=YYYY-MM-DD (aplicado em survey.createdAt)
    let sinceDate: Date | undefined;
    let untilDate: Date | undefined;
    try {
      if (query?.days) {
        const n = Number(query.days);
        if (!isNaN(n) && n > 0)
          sinceDate = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
      }
      if (query?.since) {
        const d = new Date(query.since);
        if (!isNaN(d.getTime())) sinceDate = d;
      }
      if (query?.until) {
        const d = new Date(query.until);
        if (!isNaN(d.getTime())) untilDate = d;
      }
    } catch {}

    // Métricas gerais
    const geral = await this.prisma.$queryRaw<any[]>`
      WITH fr AS (
        SELECT cr."userId", cr."pesquisaId",
               (cr.answers->idx->>'resposta')::int AS score
        FROM "ClimaResponse" cr
        JOIN "User" u ON u.id = cr."userId"
        JOIN "survey" s ON s.id = cr."pesquisaId"
  JOIN LATERAL generate_series(0, jsonb_array_length(cr.answers) - 1) AS idx ON true
        WHERE u."companyId" = ${companyId}
          AND (${sinceDate ?? null}::timestamptz IS NULL OR s."createdAt" >= ${sinceDate ?? null}::timestamptz)
          AND (${untilDate ?? null}::timestamptz IS NULL OR s."createdAt" <= ${untilDate ?? null}::timestamptz)
          AND (cr.answers->idx->>'resposta') ~ '^[0-9]+$'
          AND (cr.answers->idx->>'resposta')::int BETWEEN 1 AND 5
      )
      SELECT
        COALESCE(COUNT(DISTINCT fr."userId")::int, 0) AS respondentes,
        COALESCE(COUNT(DISTINCT fr."pesquisaId")::int, 0) AS pesquisas,
        COALESCE(ROUND(AVG(fr.score)::numeric, 2)::float, 0) AS "mediaGeral",
        COALESCE(ROUND((AVG(fr.score) / 5.0) * 100)::int, 0) AS "essClima",
        COALESCE(ROUND((SUM(CASE WHEN fr.score >= 4 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0)) * 100)::int, 0) AS favoraveis,
        COALESCE(ROUND((SUM(CASE WHEN fr.score = 3 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0)) * 100)::int, 0) AS neutros,
        COALESCE(ROUND((SUM(CASE WHEN fr.score <= 2 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0)) * 100)::int, 0) AS desfavoraveis
      FROM fr;
    `;

    const g = geral?.[0] || {
      respondentes: 0,
      pesquisas: 0,
      mediaGeral: 0,
      essClima: 0,
      favoraveis: 0,
      neutros: 0,
      desfavoraveis: 0,
    };

    // Por departamento
    const departamentos = await this.prisma.$queryRaw<any[]>`
      WITH fr AS (
        SELECT u."departmentId",
               cr."userId", cr."pesquisaId",
               (cr.answers->idx->>'resposta')::int AS score
        FROM "ClimaResponse" cr
        JOIN "User" u ON u.id = cr."userId"
        JOIN "survey" s ON s.id = cr."pesquisaId"
  JOIN LATERAL generate_series(0, jsonb_array_length(cr.answers) - 1) AS idx ON true
        WHERE u."companyId" = ${companyId}
          AND (${sinceDate ?? null}::timestamptz IS NULL OR s."createdAt" >= ${sinceDate ?? null}::timestamptz)
          AND (${untilDate ?? null}::timestamptz IS NULL OR s."createdAt" <= ${untilDate ?? null}::timestamptz)
          AND (cr.answers->idx->>'resposta') ~ '^[0-9]+$'
          AND (cr.answers->idx->>'resposta')::int BETWEEN 1 AND 5
      )
      SELECT COALESCE(d.name, 'Sem departamento') AS nome,
             COUNT(DISTINCT fr."userId")::int AS "uniqueUsers",
             COUNT(*)::int AS respostas,
             COALESCE(ROUND(AVG(fr.score)::numeric, 2)::float, 0) AS media,
             COALESCE(ROUND((SUM(CASE WHEN fr.score >= 4 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0)) * 100)::int, 0) AS favoraveis,
             COALESCE(ROUND((SUM(CASE WHEN fr.score = 3 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0)) * 100)::int, 0) AS neutros,
             COALESCE(ROUND((SUM(CASE WHEN fr.score <= 2 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*),0)) * 100)::int, 0) AS desfavoraveis
      FROM fr
      LEFT JOIN "Department" d ON d.id = fr."departmentId"
      GROUP BY nome
      ORDER BY nome;
    `;

    // Evolução do Clima por escala Likert (1..5): média mensal e percentuais
    const evolucaoClima = await this.prisma.$queryRaw<any[]>`
      WITH meses AS (
        SELECT date_trunc('month', d)::date AS mes
        FROM generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) d
      ),
      fr AS (
        SELECT 
          cr."userId",
          cr."pesquisaId",
          cr."createdAt",
          date_trunc('month', cr."createdAt")::date AS mes_resposta,
          (cr.answers->idx->>'resposta')::int AS score
        FROM "ClimaResponse" cr
        JOIN "User" u ON u.id = cr."userId"
        JOIN "survey" s ON s.id = cr."pesquisaId"
        JOIN LATERAL generate_series(0, jsonb_array_length(cr.answers) - 1) AS idx ON true
        WHERE u."companyId" = ${companyId}
          AND (${sinceDate ?? null}::timestamptz IS NULL OR s."createdAt" >= ${sinceDate ?? null}::timestamptz)
          AND (${untilDate ?? null}::timestamptz IS NULL OR s."createdAt" <= ${untilDate ?? null}::timestamptz)
          AND (cr.answers->idx->>'resposta') ~ '^[0-9]+$'
          AND (cr.answers->idx->>'resposta')::int BETWEEN 1 AND 5
      )
      SELECT 
        m.mes,
        TO_CHAR(m.mes, 'MM/YYYY') AS "mesFormatado",
        COUNT(DISTINCT fr."userId")::int AS "uniqueUsers",
        SUM(CASE WHEN fr.score >= 4 THEN 1 ELSE 0 END)::int AS promotores,
        SUM(CASE WHEN fr.score = 3 THEN 1 ELSE 0 END)::int AS neutros,
        SUM(CASE WHEN fr.score <= 2 THEN 1 ELSE 0 END)::int AS detratores,
        COUNT(fr.score)::int AS respondentes,
        -- Média Likert do mês (1..5)
        CASE WHEN COUNT(fr.score) > 0 THEN ROUND(AVG(fr.score)::numeric, 2)::float ELSE NULL END AS media,
        -- Média em percentual (0..100) útil para comparar visualmente
        CASE WHEN COUNT(fr.score) > 0 THEN ROUND((AVG(fr.score) / 5.0) * 100)::int ELSE NULL END AS "mediaPct",
        -- Mantém o cálculo NPS-like apenas para compatibilidade, mas o front passará a usar a média
        CASE WHEN COUNT(fr.score) > 0 THEN
          ROUND(((SUM(CASE WHEN fr.score >= 4 THEN 1 ELSE 0 END)::numeric / COUNT(fr.score)) -
                (SUM(CASE WHEN fr.score <= 2 THEN 1 ELSE 0 END)::numeric / COUNT(fr.score))) * 100)::int
        ELSE NULL END AS nps
      FROM meses m
      LEFT JOIN fr ON fr.mes_resposta <= m.mes
      GROUP BY m.mes
      ORDER BY m.mes;
    `;

    return {
      metricas: g,
      period: {
        days: query?.days ? Number(query.days) : undefined,
        since: sinceDate ? sinceDate.toISOString() : undefined,
        until: untilDate ? untilDate.toISOString() : undefined,
        filterBy: 'surveys',
      },
      departamentos,
      evolucaoClima,
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
      include: {
        user: { select: { id: true, first_Name: true, last_Name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = pulseResponses.map((r) => {
      let firstScore: any = undefined;
      try {
        const arr = Array.isArray(r.answers) ? r.answers : (r.answers as any);
        firstScore = arr?.[0]?.resposta;
      } catch {}
      return {
        responseId: r.id,
        userId: r.user?.id,
        userName:
          `${r.user?.first_Name || ''} ${r.user?.last_Name || ''}`.trim(),
        firstScore,
        createdAt: r.createdAt,
        companyId: r.companyId,
      };
    });
    // Identificar duplicados por usuário
    const duplicates: Record<string, any[]> = {};
    mapped.forEach((m) => {
      if (!m.userId) return;
      if (!duplicates[m.userId]) duplicates[m.userId] = [];
      duplicates[m.userId].push(m);
    });
    Object.keys(duplicates).forEach((k) => {
      if (duplicates[k].length < 2) delete duplicates[k];
    });
    return {
      pulsoAtual: {
        id: ultimaPesquisaPulso.id,
        titulo: ultimaPesquisaPulso.titulo,
      },
      totalRaw: mapped.length,
      duplicates,
      responses: mapped,
    };
  }

  async getEssScore(
    userId: number,
  ): Promise<{ ess: number; valores: number[]; emotions: string[] }> {
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
    responses.forEach((r) => {
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
    const pulseResponses = await this.prisma.pulseResponse.findMany({
      where: { createdAt: { gte: since }, user: { companyId } },
    });
    const scores: number[] = [];
    pulseResponses.forEach((r) => {
      try {
        const arr = Array.isArray(r.answers) ? r.answers : (r.answers as any);
        if (
          Array.isArray(arr) &&
          arr.length &&
          typeof arr[0].resposta === 'number'
        )
          scores.push(arr[0].resposta);
      } catch (e) {}
    });
    const media = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
    const ess = Math.round((media / 10) * 100);
    return { ess, valores: scores };
  }
}
