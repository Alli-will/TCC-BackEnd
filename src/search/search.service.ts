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
  {
    texto: 'Em uma escala de 0 a 10, como você avalia a frequência e a qualidade dos feedbacks que recebe sobre seu desempenho?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, o quanto você considera que sua carga de trabalho é adequada e equilibrada?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, como você avalia a disponibilidade de ferramentas e recursos para realizar seu trabalho da melhor forma?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, o quanto você percebe colaboração e trabalho em equipe entre colegas e setores?',
    opcoes: [0,1,2,3,4,5,6,7,8,9,10],
    obrigatoria: true,
  },
  {
    texto: 'Em uma escala de 0 a 10, como você avalia a transparência e a comunicação da liderança da empresa?',
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
  { texto: 'Consigo manter um bom equilíbrio entre vida pessoal e profissional?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Realizo atividades que me trazem satisfação e propósito?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Sinto-me otimista em relação ao meu futuro na empresa?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Recebo apoio emocional de meus colegas e líderes?', opcoes: [1,2,3,4,5], obrigatoria: true },
  { texto: 'Sinto que meu bem-estar emocional é valorizado pela empresa?', opcoes: [1,2,3,4,5], obrigatoria: true },
];

export const getDefaultQuestions = (tipo?: string) => {
  return (tipo === 'clima') ? DEFAULT_CLIMA_QUESTIONS : DEFAULT_PULSO_QUESTIONS;
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, excludeRespondedForUserId?: number) {
  console.log('[SearchService] findAll', { page, limit, excludeRespondedForUserId });
    const take = Math.min(Math.max(limit, 1), 100);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;

    let where: any = undefined;
    if (excludeRespondedForUserId) {
      const [pulsoIds, climaIds] = await Promise.all([
        this.prisma.pulseResponse.findMany({ where: { userId: excludeRespondedForUserId }, select: { pesquisaId: true } }),
        this.prisma.climaResponse.findMany({ where: { userId: excludeRespondedForUserId }, select: { pesquisaId: true } }),
      ]);
      const respondedIds = Array.from(new Set([...pulsoIds.map(r => r.pesquisaId), ...climaIds.map(r => r.pesquisaId)]));
      if (respondedIds.length) {
        where = { id: { notIn: respondedIds } };
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

    const totalPages = Math.max(Math.ceil(total / take), 1);

    return { items, meta: { total, page: currentPage, limit: take, totalPages } };
  }

  async findOne(id: number, userIdToCheck?: number) {
  console.log('[SearchService] findOne', { id, userIdToCheck });
    const search = await this.prisma.search.findUnique({ where: { id } });
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

  async respond(dto: RespondSearchDto, userId: number) {
  console.log('[SearchService] respond', { dto, userId });
    const search = await this.prisma.search.findUnique({ where: { id: dto.searchId } });
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
      return this.prisma.pulseResponse.create({ data: { userId, pesquisaId: dto.searchId, answers: dto.answers } });
    }
    const exists = await this.prisma.climaResponse.findFirst({ where: { userId, pesquisaId: dto.searchId } });
    if (exists) throw new ConflictException('Usuário já respondeu esta pesquisa');
    return this.prisma.climaResponse.create({ data: { userId, pesquisaId: dto.searchId, answers: dto.answers } });
  }

  async create(data: CreateSearchDto) {
  const basePadrao = data.tipo === 'clima' ? DEFAULT_CLIMA_QUESTIONS : DEFAULT_PULSO_QUESTIONS;
  const perguntas = (data.perguntas && data.perguntas.length) ? data.perguntas : basePadrao;
    return this.prisma.search.create({
      data: { titulo: data.titulo, tipo: data.tipo, perguntas: perguntas as any },
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
}
