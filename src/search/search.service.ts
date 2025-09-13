import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { RespondSearchDto } from './dto/respond-search.dto';

// Perguntas padrão para PESQUISA TIPO PULSO (escala 0-10) — reduzido para 5 perguntas
const DEFAULT_PULSO_QUESTIONS = [
  {
    texto: 'Em uma escala de 0 a 10, o quanto você recomendaria a empresa como um bom lugar para trabalhar para um amigo ou conhecido?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, o quanto você se sente valorizado(a) pelo seu trabalho aqui?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, como você avalia as oportunidades de crescimento profissional na empresa?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, o quanto você acredita que sua opinião é ouvida e considerada?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, como você avalia se o ambiente de trabalho favorece sua saúde e bem-estar?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
];

// Perguntas padrão para PESQUISA TIPO CLIMA (escala Likert 1-5) — reduzido para 5 perguntas
const DEFAULT_CLIMA_QUESTIONS = [
  { texto: 'Sinto-me satisfeito(a) com meu trabalho atualmente?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Tenho motivação para realizar minhas tarefas diariamente?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Tenho energia suficiente para desempenhar bem minhas funções?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Sinto-me confiante para lidar com os desafios do meu trabalho?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Meu nível de estresse está sob controle?', opcoes: [1,2,3,4,5], obrigatoria: true },
];

export const getDefaultQuestions = (tipo?: string) => {
  return (tipo === 'clima') ? DEFAULT_CLIMA_QUESTIONS : DEFAULT_PULSO_QUESTIONS;
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, excludeRespondedForUserId?: number, companyId?: number) {
  try {
    const take = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;

  let where: any = {};
  if (companyId) where.companyId = companyId;
    if (excludeRespondedForUserId) {
      const userFilter: any = { userId: excludeRespondedForUserId };
      if (companyId) {
        userFilter.companyId = companyId; // redundante se pulses/climas tiverem companyId preenchido
      }
      const [pulsoIds, climaIds] = await Promise.all([
        this.prisma.pulseResponse.findMany({ where: userFilter, select: { pesquisaId: true } }),
        this.prisma.climaResponse.findMany({ where: userFilter, select: { pesquisaId: true } }),
      ]);
      const respondedIds = Array.from(new Set([...pulsoIds.map(r => r.pesquisaId), ...climaIds.map(r => r.pesquisaId)]));
      if (respondedIds.length) {
        where = { ...where, id: { notIn: respondedIds } };
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.search.count({ where }),
      this.prisma.search.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Anexar contagem de respondentes (relatório rápido) para cada pesquisa.
    // Critério:
    //  - pulso: usuários distintos com nota válida (0-10) na primeira pergunta (considerando somente resposta mais recente por usuário)
    //  - clima: total de registros de resposta (1 por usuário)
    try {
      if (items.length) {
        const pulsoIds = items.filter(i => i.tipo === 'pulso').map(i => i.id);
        const climaIds = items.filter(i => i.tipo === 'clima').map(i => i.id);
        const pulseResponses = pulsoIds.length ? await this.prisma.pulseResponse.findMany({
          where: {
            pesquisaId: { in: pulsoIds },
            ...(companyId ? { user: { companyId } } : {}),
          },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        }) : [];
        const climaResponses = climaIds.length ? await this.prisma.climaResponse.findMany({
          where: {
            pesquisaId: { in: climaIds },
            ...(companyId ? { user: { companyId } } : {}),
          },
          select: { pesquisaId: true },
        }) : [];

        const pulsoCountMap: Record<number, number> = {};
        // Map searchId -> set of userIds counted
        const seenPerSearch: Record<number, Set<number>> = {};
        for (const resp of pulseResponses as any[]) {
          const sId = resp.pesquisaId;
            if (!seenPerSearch[sId]) seenPerSearch[sId] = new Set<number>();
          const userId = resp.user?.id;
          if (!userId || seenPerSearch[sId].has(userId)) continue; // já contamos a mais recente
          let first: any;
          try {
            const arr = Array.isArray(resp.answers) ? resp.answers : (resp.answers as any);
            first = arr?.[0]?.resposta;
          } catch { first = undefined; }
          if (typeof first === 'number' && first >= 0 && first <= 10) {
            seenPerSearch[sId].add(userId);
            pulsoCountMap[sId] = seenPerSearch[sId].size;
          }
        }

        const climaCountMap: Record<number, number> = {};
        for (const c of climaResponses) {
          climaCountMap[c.pesquisaId] = (climaCountMap[c.pesquisaId] || 0) + 1;
        }

        items.forEach(it => {
          (it as any).respondentes = it.tipo === 'pulso'
            ? (pulsoCountMap[it.id] || 0)
            : (climaCountMap[it.id] || 0);
        });
      }
    } catch (e) {
    }

    const totalPages = Math.max(Math.ceil(total / take), 1);

    return { items, meta: { total, page: currentPage, limit: take, totalPages } };
    } catch (error: any) {
      return { items: [], meta: { total: 0, page: 1, limit: limit, totalPages: 1 }, error: error?.message } as any;
    }
  }

  async findOne(id: number, userIdToCheck?: number, companyId?: number) {
  let search;
  try {
    search = await this.prisma.search.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
  } catch (e: any) {
    throw new NotFoundException('Pesquisa não encontrada');
  }
    if (!search) throw new NotFoundException('Pesquisa não encontrada');
    if (userIdToCheck) {
      const already = search.tipo === 'pulso'
        ? await this.prisma.pulseResponse.findFirst({ where: { userId: userIdToCheck, pesquisaId: id } })
        : await this.prisma.climaResponse.findFirst({ where: { userId: userIdToCheck, pesquisaId: id } });
      if (already) {
        throw new ConflictException('Já respondida');
      }
    }
    return search;
  }

  async respond(dto: RespondSearchDto, userId: number, companyId?: number) {
  const search = await this.prisma.search.findFirst({ where: { id: dto.searchId, ...(companyId ? { companyId } : {}) } });
    if (!search) throw new NotFoundException('Pesquisa não encontrada');

    // Validar obrigatoriedade: todas precisam ter resposta não nula/undefined
    const perguntas: any[] = Array.isArray(search.perguntas) ? search.perguntas : [];
    const provided = dto.answers || [];
    const missing: number[] = [];
    perguntas.forEach((_, idx) => {
      const ans = provided[idx]?.resposta;
      if (ans === undefined || ans === null || ans === '') missing.push(idx + 1);
    });
    if (missing.length) {
      throw new BadRequestException(`Todas as perguntas são obrigatórias. Faltando responder: ${missing.join(', ')}`);
    }

    // Verificar se já respondeu
    if (search.tipo === 'pulso') {
      const exists = await this.prisma.pulseResponse.findFirst({ where: { userId, pesquisaId: dto.searchId } });
      if (exists) throw new ConflictException('Usuário já respondeu esta pesquisa');
  return this.prisma.pulseResponse.create({ data: { userId, pesquisaId: dto.searchId, answers: dto.answers, companyId } as any });
    }
    const exists = await this.prisma.climaResponse.findFirst({ where: { userId, pesquisaId: dto.searchId } });
    if (exists) throw new ConflictException('Usuário já respondeu esta pesquisa');
  return this.prisma.climaResponse.create({ data: { userId, pesquisaId: dto.searchId, answers: dto.answers, companyId } as any });
  }

  async create(data: CreateSearchDto, companyId?: number) {
    const basePadrao = data.tipo === 'clima' ? DEFAULT_CLIMA_QUESTIONS : DEFAULT_PULSO_QUESTIONS;
    const perguntasIn = (data.perguntas && data.perguntas.length) ? data.perguntas : basePadrao;
    // Garante formato consistente no JSON, preservando questionId quando enviado
    const perguntas = perguntasIn.map((p: any) => ({
      texto: p.texto,
      opcoes: Array.isArray(p.opcoes) ? p.opcoes : [],
      obrigatoria: !!p.obrigatoria,
      ...(p.questionId ? { questionId: Number(p.questionId) } : {}),
    }));
    return this.prisma.search.create({
      data: { titulo: data.titulo, tipo: data.tipo, perguntas: perguntas as any, companyId } as any,
    });
  }

  async addQuestion(searchId: number, question: { texto: string; opcoes: any; obrigatoria?: boolean }) {
    // Busca pesquisa
    const search = await this.prisma.search.findUnique({ where: { id: searchId } });
    if (!search) throw new Error('Pesquisa não encontrada');
    const perguntas = Array.isArray(search.perguntas) ? search.perguntas : [];
    perguntas.push(question);
    return this.prisma.search.update({
      where: { id: searchId },
      data: { perguntas },
    });
  }

  async removeQuestion(searchId: number, questionIndex: number) {
    const search = await this.prisma.search.findUnique({ where: { id: searchId } });
    if (!search) throw new Error('Pesquisa não encontrada');
    const perguntas = Array.isArray(search.perguntas) ? search.perguntas : [];
    perguntas.splice(questionIndex, 1);
    return this.prisma.search.update({
      where: { id: searchId },
      data: { perguntas },
    });
  }

  /**
   * Gera relatório detalhado de uma pesquisa.
   * Para pulso: calcula NPS (1ª pergunta escala 0-10), distribuição NPS, médias por pergunta e distribuição de opções.
   * Para clima: médias por pergunta, distribuição (1-5) e média geral.
   */
  async getReport(id: number, departmentId?: number, companyId?: number) {
    // Primeiro tenta localizar a pesquisa dentro do escopo da empresa;
    let search = await this.prisma.search.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!search && companyId) {
      search = await this.prisma.search.findFirst({ where: { id } });
    }
    if (!search) throw new NotFoundException('Pesquisa não encontrada');
    const perguntas: any[] = Array.isArray(search.perguntas) ? search.perguntas : [];

    const isPulso = search.tipo === 'pulso';
    // Monta condição de filtro opcional por departamento (via user.departmentId)
    // Evita perder respostas antigas que não tinham companyId preenchido (legado):
    // Só filtra por companyId se a pesquisa em si tem companyId (ou seja, foi criada já multi-tenant) E o companyId do usuário foi enviado.
  const applyCompanyFilter = !!(companyId && (search as any).companyId);
    const baseWhere: any = { pesquisaId: id, ...(applyCompanyFilter ? { companyId } : {}) };
    const includeUser = { user: true };
    if (departmentId) {
      baseWhere.user = { departmentId };
    }
    let responses = isPulso
      ? await this.prisma.pulseResponse.findMany({ where: baseWhere, include: includeUser })
      : await this.prisma.climaResponse.findMany({ where: baseWhere, include: includeUser });

    // Fallback: se filtramos por companyId mas veio 0 respostas, tentar novamente sem companyId (legacy rows com companyId nulo)
    if (applyCompanyFilter && responses.length === 0) {
      const legacyWhere: any = { pesquisaId: id };
      if (departmentId) legacyWhere.user = { departmentId };
      const legacyResponses = isPulso
        ? await this.prisma.pulseResponse.findMany({ where: legacyWhere, include: includeUser })
        : await this.prisma.climaResponse.findMany({ where: legacyWhere, include: includeUser });
      if (legacyResponses.length) {
        responses = legacyResponses;
      }
    }

    let departmentInfo: { id: number; name: string } | null = null;
    if (departmentId) {
      const dep = await this.prisma.department.findUnique({ where: { id: departmentId } });
      if (dep) departmentInfo = { id: dep.id, name: dep.name };
    }

    const totalRespondentes = responses.length;
    const perguntasResultados: any[] = perguntas.map((_p, idx) => ({
      index: idx,
      texto: _p.texto,
      media: null as number | null,
      distribuicao: {} as Record<string, { count: number; percent: number }> // opção -> stats
    }));

    let nps: number | null = null;
    let npsDistribuicao: Record<string, { count: number; percent: number }> | null = null;
    let promotores = 0, detratores = 0, neutros = 0;

    if (!totalRespondentes) {
      // Sem respostas: retorna estrutura vazia
      return {
        id: search.id,
        titulo: search.titulo,
        tipo: search.tipo,
        createdAt: search.createdAt,
        totalRespondentes,
        perguntas: perguntasResultados,
        nps,
        promotores,
        detratores,
        neutros,
        npsDistribuicao,
        department: departmentInfo
      };
    }

    // Agrega respostas
    for (const resp of responses as any[]) {
      const ansArr: any[] = Array.isArray(resp.answers) ? resp.answers : [];
      ansArr.forEach((ans, idx) => {
        if (!perguntasResultados[idx]) return;
        const valor = ans?.resposta;
        if (valor === undefined || valor === null || valor === '') return;
        // média numérica se for number
        if (typeof valor === 'number') {
          const pr = perguntasResultados[idx];
          if (pr._soma === undefined) pr._soma = 0;
            if (pr._count === undefined) pr._count = 0;
          pr._soma += valor;
          pr._count += 1;
        }
        // distribuição
        const key = String(valor);
        const prd = perguntasResultados[idx].distribuicao;
        if (!prd[key]) prd[key] = { count: 0, percent: 0 };
        prd[key].count += 1;
      });
    }

    // Finaliza métricas por pergunta
    perguntasResultados.forEach(pr => {
      if (typeof pr._count === 'number' && pr._count > 0) {
        pr.media = Number((pr._soma / pr._count).toFixed(2));
      }
      const distribVals: any[] = Object.values(pr.distribuicao || {});
      const totalLocal: number = distribVals.reduce((acc: number, v: any) => acc + (typeof v.count === 'number' ? v.count : 0), 0);
      if (totalLocal > 0) {
        Object.entries(pr.distribuicao).forEach(([k, v]: [string, any]) => {
          const countNum = typeof v.count === 'number' ? v.count : 0;
          v.percent = Number(((countNum / totalLocal) * 100).toFixed(2));
        });
      }
      delete pr._soma; delete pr._count;
    });

    if (isPulso) {
      // NPS CLÁSSICO: somente a PRIMEIRA pergunta (recomendação). Cada usuário responde uma vez por pesquisa.
      // Cada usuário => 1 nota (0-10) => classificado e entra na distribuição.
      const dist: Record<number, number> = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0};
      for (const resp of responses as any[]) {
        const ansArray = Array.isArray(resp.answers) ? resp.answers : [];
        const first = ansArray[0]?.resposta;
        if (typeof first === 'number' && first >= 0 && first <= 10) {
          dist[first] = (dist[first] || 0) + 1;
        }
      }
      // Total de respondentes = número de respostas (já é garantido 1 por usuário por pesquisa)
      const total = Object.values(dist).reduce((a,b)=>a+b,0);
      promotores = (dist[9]||0) + (dist[10]||0);
      neutros = (dist[7]||0) + (dist[8]||0);
      detratores = (dist[0]||0)+(dist[1]||0)+(dist[2]||0)+(dist[3]||0)+(dist[4]||0)+(dist[5]||0)+(dist[6]||0);
      nps = total ? Math.round(((promotores/total) - (detratores/total))*100) : null;
      npsDistribuicao = {};
      for (let i=0;i<=10;i++) {
        const c = dist[i] || 0;
        npsDistribuicao[String(i)] = { count: c, percent: total ? Number(((c/total)*100).toFixed(2)) : 0 };
      }
    }

    return {
      id: search.id,
      titulo: search.titulo,
      tipo: search.tipo,
      createdAt: search.createdAt,
      totalRespondentes,
      perguntas: perguntasResultados,
      nps,
      promotores,
      detratores,
      neutros,
      npsDistribuicao,
      department: departmentInfo,
    };
  }
}
