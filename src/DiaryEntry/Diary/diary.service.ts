import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiaryEntryDto } from './dto/Create-Diary-Entry-Dto';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    createDiaryEntryDto: CreateDiaryEntryDto,
    userId: number,
  ) {
    try {
      const { reasonIds, emotion, description, date } = createDiaryEntryDto;

      const reasons = await this.prisma.reasonEmotion.findMany({
        where: { id: { in: reasonIds } },
      });
      if (reasons.length !== reasonIds.length) {
        throw new BadRequestException('Um ou mais motivos são inválidos.');
      }

      const diaryEntry = await this.prisma.diaryEntry.create({
        data: {
          date: new Date(date), // Garante formato ISO-8601
          emotion,
          description,
          user: { connect: { id: userId } },
          reasons: {
            connect: reasonIds.map(id => ({ id })),
          },
        },
        include: { reasons: true, user: true },
      });

      // ---- DETECÇÃO DE ALERTA ----
      const palavrasChave = ['cansaço', 'exausto', 'desanimado', 'sobrecarregado'];
      const motivosSensíveis = ['trabalho'];
      const emocoesNegativas = ['tristeza', 'ansiedade', 'depressão'];

      const descricaoLower = description.toLowerCase();
      const hasPalavraChave = palavrasChave.some(p => descricaoLower.includes(p));
      const hasMotivoSensivel = reasons.some(r =>
        motivosSensíveis.includes(r.reason.toLowerCase()),
      );
      const isEmocaoNegativa = emocoesNegativas.includes(emotion.toLowerCase());

      if (hasPalavraChave && hasMotivoSensivel && isEmocaoNegativa) {
        // Busca o departamento do usuário
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { department: true },
        });
        const departamento = user?.department?.name || 'Desconhecido';
        const admins = await this.prisma.user.findMany({
          where: { role: 'admin' },
        });

        for (const admin of admins) {
          await this.notificationService.createNotification(
            `Alerta: um colaborador do departamento ${departamento} registrou uma entrada com sinais de sofrimento.`,
            admin.id,
          );
        }
      }

      return diaryEntry;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Erro ao criar entrada do diário.',
      );
    }
  }

  async findEntriesByUserId(userId: number) {
    return await this.prisma.diaryEntry.findMany({
      where: { userId },
      include: { user: true, reasons: true },
    });
  }

  async hasEntryToday(userId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const entry = await this.prisma.diaryEntry.findFirst({
      where: {
        userId,
        created_at: {
          gte: today,
          lte: now,
        },
      },
    });

    return !!entry;
  }

  async findAllDiaries() {
    return await this.prisma.diaryEntry.findMany({
      include: {
        user: { include: { department: true } },
        reasons: true,
      },
    });
  }

  async getInsights(userId: number) {
    const entries = await this.findEntriesByUserId(userId);
    if (!entries || entries.length === 0) {
      return {
        emocaoMaisFrequente: '-',
        nivelEnergia: '-',
        nivelEstresse: '-',
      };
    }
    // Contar emoções
    const contagem: { [emocao: string]: number } = {};
    let energiaTotal = 0;
    let estresseTotal = 0;
    for (const entrada of entries) {
      const emocao = entrada.emotion || 'Sem emoção';
      contagem[emocao] = (contagem[emocao] || 0) + 1;
      // Energia: feliz=2, neutro=1, triste/ansioso/irritado=0
      if (emocao === 'feliz') energiaTotal += 2;
      else if (emocao === 'neutro') energiaTotal += 1;
      // Estresse: ansioso/irritado contam como 1
      if (emocao === 'ansioso' || emocao === 'irritado') estresseTotal += 1;
    }
    // Emoção mais frequente
    const emocaoMaisFrequente = Object.keys(contagem).reduce((a, b) => contagem[a] > contagem[b] ? a : b);
    // Nível de energia
    const mediaEnergia = energiaTotal / entries.length;
    let nivelEnergia = '-';
    if (mediaEnergia >= 1.5) nivelEnergia = 'Alta';
    else if (mediaEnergia >= 1) nivelEnergia = 'Média';
    else nivelEnergia = 'Baixa';
    // Nível de estresse
    const percEstresse = estresseTotal / entries.length;
    let nivelEstresse = '-';
    if (percEstresse >= 0.6) nivelEstresse = 'Alto';
    else if (percEstresse >= 0.3) nivelEstresse = 'Médio';
    else nivelEstresse = 'Baixo';
    return {
      emocaoMaisFrequente,
      nivelEnergia,
      nivelEstresse,
    };
  }

  async getGraphData(userId: number, period: string) {
    const entries = await this.findEntriesByUserId(userId);
    let labels: string[] = [];
    let agrupado: { [label: string]: { [emocao: string]: number } } = {};
    let entradasFiltradas = entries;
    const hoje = new Date();
    if (period === 'semana') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(hoje.getDate() - 6);
      entradasFiltradas = entries.filter((entrada) => {
        if (!entrada.date) return false;
        const data = new Date(entrada.date);
        return data >= umaSemanaAtras && data <= hoje;
      });
      for (const entrada of entradasFiltradas) {
        const data = entrada.date ? entrada.date.toISOString().split('T')[0] : 'Sem data';
        const emocao = entrada.emotion || 'Sem emoção';
        if (!agrupado[data]) agrupado[data] = {};
        agrupado[data][emocao] = (agrupado[data][emocao] || 0) + 1;
      }
      labels = Object.keys(agrupado).sort();
    } else if (period === 'mes') {
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth() + 1;
      entradasFiltradas = entries.filter((entrada) => {
        if (!entrada.date) return false;
        const data = new Date(entrada.date);
        return data.getFullYear() === anoAtual && (data.getMonth() + 1) === mesAtual;
      });
      for (const entrada of entradasFiltradas) {
        const data = entrada.date ? entrada.date.toISOString().split('T')[0] : 'Sem data';
        const emocao = entrada.emotion || 'Sem emoção';
        if (!agrupado[data]) agrupado[data] = {};
        agrupado[data][emocao] = (agrupado[data][emocao] || 0) + 1;
      }
      labels = Object.keys(agrupado).sort();
    } else if (period === 'ano') {
      for (const entrada of entries) {
        if (!entrada.date) continue;
        const ano = new Date(entrada.date).getFullYear().toString();
        const emocao = entrada.emotion || 'Sem emoção';
        if (!agrupado[ano]) agrupado[ano] = {};
        agrupado[ano][emocao] = (agrupado[ano][emocao] || 0) + 1;
      }
      labels = Object.keys(agrupado).sort();
    }
    // Obter todas as emoções únicas
    const emocoesSet = new Set<string>();
    labels.forEach((label) => {
      Object.keys(agrupado[label]).forEach((e) => emocoesSet.add(e));
    });
    const emocoes = Array.from(emocoesSet);
    // Montar datasets para cada emoção
    const datasets = emocoes.map((emocao) => ({
      label: emocao,
      data: labels.map((label) => agrupado[label][emocao] || 0),
    }));
    return {
      labels,
      datasets,
    };
  }

  /**
   * Retorna a porcentagem de cada emoção (triste, frustrado, neutro, tranquilo, realizado)
   * nas entradas do diário. Ideal para indicadores circulares no dashboard.
   */
  async getEmotionPercentages() {
    // Emoções padronizadas e seus emojis/labels
    const EMOTIONS = [
      { key: 'triste', label: 'Triste', emoji: '😢' },
      { key: 'frustrado', label: 'Frustrado', emoji: '😠' },
      { key: 'neutro', label: 'Neutro', emoji: '😐' },
      { key: 'tranquilo', label: 'Tranquilo', emoji: '🙂' },
      { key: 'realizado', label: 'Realizado', emoji: '😃' },
    ];
    // Busca todas as entradas
    const entries = await this.prisma.diaryEntry.findMany();
    const total = entries.length;
    // Conta cada emoção
    const counts: { [key: string]: number } = {};
    for (const { emotion } of entries) {
      const key = emotion?.toLowerCase();
      if (EMOTIONS.some(e => e.key === key)) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    // Monta resultado
    const result = EMOTIONS.map(e => ({
      key: e.key,
      label: e.label,
      emoji: e.emoji,
      count: counts[e.key] || 0,
      percent: total > 0 ? Math.round(((counts[e.key] || 0) / total) * 100) : 0,
    }));
    return result;
  }
}
