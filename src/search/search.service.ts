import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSearchDto } from './dto/create-search.dto';
import { RespondSearchDto } from './dto/respond-search.dto';

// Perguntas padrão para PESQUISA TIPO PULSO (escala 0-10)
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

// Perguntas padrão para PESQUISA TIPO CLIMA (escala Likert 1-5) 
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

  async findAll(page = 1, limit = 10, excludeRespondedForUserId?: number, companyId?: number, userDepartmentId?: number, adminSeeAll = false) {
  try {
    const take = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;

  let where: any = {};
  if (companyId) where.companyId = companyId;
    if (!adminSeeAll) {
      if (userDepartmentId != null) {
        // Mostrar somente pesquisas do próprio departamento ou abertas.
        where = {
          ...where,
          OR: [
            { AND: [{ departments: { none: {} } }, { departmentId: null }] },
            { departments: { some: { departmentId: userDepartmentId } } },
            { departmentId: userDepartmentId },
          ],
        };
      } else {
        // Usuários sem departamento: apenas pesquisas abertas a todos (sem vínculos e departmentId nulo)
        where = { ...where, AND: [{ departments: { none: {} } }, { departmentId: null }] };
      }
    }

    // Quando listando para usuário responder, ainda exclui as já respondidas por ele
    if (excludeRespondedForUserId) {
      const userFilter: any = { userId: excludeRespondedForUserId };
      if (companyId) userFilter.companyId = companyId;
      const [pulsoIds, climaIds] = await Promise.all([
        this.prisma.pulseResponse.findMany({ where: userFilter, select: { pesquisaId: true } }),
        this.prisma.climaResponse.findMany({ where: userFilter, select: { pesquisaId: true } }),
      ]);
      const respondedIds = Array.from(new Set([...pulsoIds.map(r => r.pesquisaId), ...climaIds.map(r => r.pesquisaId)]));
      if (respondedIds.length) where = { ...where, id: { notIn: respondedIds } };
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
    // Busca vínculos de departamentos em lote para anexar departmentIds por pesquisa
    let linksBySearch: Record<number, number[]> = {};
    try {
      const ids = items.map(i => i.id);
      if (ids.length) {
        const rows = await (this.prisma as any).surveyDepartment.findMany({ where: { searchId: { in: ids } } });
        for (const r of rows || []) {
          if (!linksBySearch[r.searchId]) linksBySearch[r.searchId] = [];
          linksBySearch[r.searchId].push(r.departmentId);
        }
      }
    } catch {}

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
        const seenPerSearch: Record<number, Set<number>> = {};
        for (const resp of pulseResponses as any[]) {
          const sId = resp.pesquisaId;
            if (!seenPerSearch[sId]) seenPerSearch[sId] = new Set<number>();
          const userId = resp.user?.id;
          if (!userId || seenPerSearch[sId].has(userId)) continue;
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
          const joinIds = Array.isArray(linksBySearch[it.id]) ? linksBySearch[it.id] : [];
          (it as any).departmentIds = joinIds.length
            ? joinIds
            : (it as any).departmentId
              ? [(it as any).departmentId]
              : [];
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

  async findOne(id: number, userIdToCheck?: number, companyId?: number, userDepartmentId?: number) {
  let search;
  try {
    const baseWhere: any = { id, ...(companyId ? { companyId } : {}) };
    if (userDepartmentId != null) {
      baseWhere.OR = [
        { AND: [{ departments: { none: {} } }, { departmentId: null }] },
        { departments: { some: { departmentId: userDepartmentId } } },
        { departmentId: userDepartmentId },
      ];
    } else {
      // Quando usuário não tem departamento associado, permitir apenas pesquisas abertas a todos
      baseWhere.AND = [{ departments: { none: {} } }, { departmentId: null }];
    }
  search = await this.prisma.search.findFirst({ where: baseWhere });
  } catch (e: any) {
    throw new NotFoundException('Pesquisa não encontrada');
  }
    if (!search) throw new NotFoundException('Pesquisa não encontrada');
    let joinIds: number[] = [];
    try {
      const rows = await (this.prisma as any).surveyDepartment.findMany({ where: { searchId: id } });
      joinIds = (rows || []).map((r: any) => r.departmentId);
    } catch {}
    (search as any).departmentIds = joinIds.length ? joinIds : (search as any).departmentId ? [(search as any).departmentId] : [];
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

  async respond(dto: RespondSearchDto, userId: number, companyId?: number, userDepartmentId?: number) {
  const baseWhere: any = { id: dto.searchId, ...(companyId ? { companyId } : {}) };
  if (userDepartmentId != null) {
    baseWhere.OR = [
      { AND: [{ departments: { none: {} } }, { departmentId: null }] },
      { departments: { some: { departmentId: userDepartmentId } } },
      { departmentId: userDepartmentId },
    ];
  } else {
    // Sem departamento no usuário: só pode responder pesquisas abertas (sem target de departamento)
    baseWhere.AND = [{ departments: { none: {} } }, { departmentId: null }];
  }
  const search = await this.prisma.search.findFirst({ where: baseWhere });
    if (!search) throw new NotFoundException('Pesquisa não encontrada');

    // Validar obrigatoriedade: somente perguntas marcadas como obrigatórias exigem resposta
    const perguntas: any[] = Array.isArray(search.perguntas) ? search.perguntas : [];
    const provided = Array.isArray(dto.answers) ? dto.answers : [];
    const missing: number[] = [];
    perguntas.forEach((q: any, idx) => {
      const obrigatoria = !(q && q.obrigatoria === false); // default: obrigatória
      if (!obrigatoria) return; // opcional
      const ans = provided[idx]?.resposta;
      if (ans === undefined || ans === null || ans === '') missing.push(idx + 1);
    });
    if (missing.length) {
      throw new BadRequestException(`Há perguntas obrigatórias sem resposta: ${missing.join(', ')}`);
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
    //valida lista de setores (quando enviada). Mantém compatibilidade com departmentId legado.
    const listIds = Array.isArray((data as any).departmentIds) ? (data as any).departmentIds : [];
    if (listIds.length) {
      // valida todos
      const deps = await this.prisma.department.findMany({ where: { id: { in: listIds }, ...(companyId ? { companyId } : {}) } });
      const found = new Set(deps.map(d => d.id));
      const missing = listIds.filter(id => !found.has(id));
      if (missing.length) throw new BadRequestException('Departamento inválido');
    }
    // Compatibilidade: se departmentIds não enviado, aceita departmentId único
    let legacyDepartmentId: number | null | undefined = (data as any).departmentId as any;
    if (!listIds.length && legacyDepartmentId != null) {
      const dep = await this.prisma.department.findFirst({ where: { id: legacyDepartmentId, ...(companyId ? { companyId } : {}) } });
      if (!dep) throw new BadRequestException('Departamento inválido');
    }
    const created = await this.prisma.search.create({
      data: { titulo: data.titulo, tipo: data.tipo, perguntas: perguntas as any, companyId, departmentId: listIds.length ? null : legacyDepartmentId } as any,
    });
    if (listIds.length) {
      await (this.prisma as any).surveyDepartment.createMany({ data: listIds.map((id: number) => ({ searchId: created.id, departmentId: id })) });
    }
    return created;
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

  private async hasResponses(searchId: number) {
    const [p, c] = await Promise.all([
      this.prisma.pulseResponse.count({ where: { pesquisaId: searchId } }),
      this.prisma.climaResponse.count({ where: { pesquisaId: searchId } }),
    ]);
    return (p + c) > 0;
  }

  async update(id: number, dto: Partial<CreateSearchDto>, companyId?: number) {
    const search = await this.prisma.search.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!search) throw new NotFoundException('Pesquisa não encontrada');
    if (await this.hasResponses(id)) throw new ConflictException('Pesquisa já possui respostas e não pode ser alterada');
    const data: any = {};
    if (dto.titulo != null) data.titulo = dto.titulo;
    if (dto.tipo != null) data.tipo = dto.tipo;
    if (dto.perguntas) {
      data.perguntas = dto.perguntas.map((p: any) => ({
        texto: p.texto,
        opcoes: Array.isArray(p.opcoes) ? p.opcoes : [],
        obrigatoria: !!p.obrigatoria,
        ...(p.questionId ? { questionId: Number(p.questionId) } : {}),
      }));
    }
    const listIds = Array.isArray((dto as any).departmentIds) ? (dto as any).departmentIds : undefined;
    if (listIds) {
      // valida todos
      if (listIds.length) {
        const deps = await this.prisma.department.findMany({ where: { id: { in: listIds }, ...(companyId ? { companyId } : {}) } });
        const found = new Set(deps.map(d => d.id));
        const missing = listIds.filter(id => !found.has(id));
        if (missing.length) throw new BadRequestException('Departamento inválido');
      }
      data.departmentId = null;
      await (this.prisma as any).surveyDepartment.deleteMany({ where: { searchId: id } });
      if (listIds.length) {
        await (this.prisma as any).surveyDepartment.createMany({ data: listIds.map((dId: number) => ({ searchId: id, departmentId: dId })) });
      }
    } else if ((dto as any).departmentId !== undefined) {
      const depIdVal: any = (dto as any).departmentId;
      await (this.prisma as any).surveyDepartment.deleteMany({ where: { searchId: id } });
      if (depIdVal === null) {
        data.departmentId = null;
      } else {
        const dep = await this.prisma.department.findFirst({ where: { id: Number(depIdVal), ...(companyId ? { companyId } : {}) } });
        if (!dep) throw new BadRequestException('Departamento inválido');
        data.departmentId = Number(depIdVal);
      }
    }
    return this.prisma.search.update({ where: { id }, data });
  }

  async remove(id: number, companyId?: number) {
    const search = await this.prisma.search.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!search) throw new NotFoundException('Pesquisa não encontrada');
    if (await this.hasResponses(id)) throw new ConflictException('Pesquisa já possui respostas e não pode ser excluída');
    return this.prisma.search.delete({ where: { id } });
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
   * Para pulso: calcula eNPS (1ª pergunta escala 0-10), distribuição NPS, médias por pergunta e distribuição de opções.
   * Para clima: médias por pergunta, distribuição (1-5) e média geral.
   */
  async getReport(id: number, departmentId?: number, companyId?: number) {
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

    //se filtramos por companyId mas veio 0 respostas, tentar novamente sem companyId (legacy rows com companyId nulo)
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
      tipoResposta: _p?.tipoResposta || (Array.isArray(_p.opcoes) && _p.opcoes.length ? 'quantitativa' : 'qualitativa'),
      media: null as number | null,
      distribuicao: {} as Record<string, { count: number; percent: number }> 
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

  /**
   * Lista respostas textuais (qualitativas) anonimizadas de uma pergunta específica.
   * Nunca retorna identificadores de usuário; aplica filtro opcional por departamento e por empresa (quando aplicável).
   */
  async getTextAnswers(id: number, questionIndex: number, departmentId?: number, companyId?: number) {
    if (isNaN(questionIndex) || questionIndex < 0) {
      throw new BadRequestException('Parâmetro questionIndex inválido');
    }
    let search = await this.prisma.search.findFirst({ where: { id, ...(companyId ? { companyId } : {}) } });
    if (!search && companyId) {
      search = await this.prisma.search.findFirst({ where: { id } });
    }
    if (!search) throw new NotFoundException('Pesquisa não encontrada');
    const perguntas: any[] = Array.isArray(search.perguntas) ? search.perguntas : [];
    const alvo = perguntas[questionIndex];
    if (!alvo) throw new NotFoundException('Pergunta não encontrada');
    const isPulso = search.tipo === 'pulso';

    const applyCompanyFilter = !!(companyId && (search as any).companyId);
    const baseWhere: any = { pesquisaId: id, ...(applyCompanyFilter ? { companyId } : {}) };
    if (departmentId) baseWhere.user = { departmentId };

    const includeUser = { user: true };
    let responses = isPulso
      ? await this.prisma.pulseResponse.findMany({ where: baseWhere, include: includeUser })
      : await this.prisma.climaResponse.findMany({ where: baseWhere, include: includeUser });
    if (applyCompanyFilter && responses.length === 0) {
      const legacyWhere: any = { pesquisaId: id };
      if (departmentId) legacyWhere.user = { departmentId };
      const legacy = isPulso
        ? await this.prisma.pulseResponse.findMany({ where: legacyWhere, include: includeUser })
        : await this.prisma.climaResponse.findMany({ where: legacyWhere, include: includeUser });
      if (legacy.length) responses = legacy;
    }

  // Coletar apenas respostas textuais, limpando e anonimando
    const coletadas: { texto: string }[] = [];
    for (const r of responses as any[]) {
      const ansArr: any[] = Array.isArray(r.answers) ? r.answers : [];
      const v = ansArr[questionIndex]?.resposta;
      if (typeof v === 'string') {
        const texto = String(v).trim();
        if (texto) coletadas.push({ texto });
      }
    }

    const min = 2; // limiar mínimo para preservar anonimato
    return {
      id: search.id,
      questionIndex,
      tipo: search.tipo,
      total: coletadas.length,
      min,
      respostas: coletadas.length >= min ? coletadas : [],
    };
  }
}
