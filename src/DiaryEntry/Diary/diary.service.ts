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
      const { reasonIds, emotion, description, date } = createDiaryEntryDto as any;
      console.log('[DiaryService.create] INPUT', { userId, reasonIds, emotion, descriptionLength: description?.length, date });
      if (!userId) {
        throw new BadRequestException('Usuário não identificado');
      }
      if (!emotion || !description) {
        throw new BadRequestException('Emotion e description são obrigatórios');
      }
      let safeReasonIds: number[] = Array.isArray(reasonIds) ? reasonIds : [];
      if (safeReasonIds.some(r => typeof r !== 'number')) {
        throw new BadRequestException('reasonIds deve conter números');
      }
      // Permitir zero motivos (opcional)
      let reasons: any[] = [];
      if (safeReasonIds.length) {
        reasons = await this.prisma.reasonEmotion.findMany({
          where: { id: { in: safeReasonIds } },
        });
        if (reasons.length !== safeReasonIds.length) {
          console.warn('[DiaryService.create] IDs inválidos', { safeReasonIds, found: reasons.map(r => r.id) });
          throw new BadRequestException('Um ou mais motivos são inválidos.');
        }
      }
      const parsedDate = date ? new Date(date) : new Date();
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestException('Data inválida');
      }
      const diaryEntry = await this.prisma.diaryEntry.create({
        data: {
          date: parsedDate, // Garante formato válido
          emotion,
          description,
          user: { connect: { id: userId } },
          reasons: {
            connect: safeReasonIds.map(id => ({ id })),
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
    } catch (error: any) {
      console.error('[DiaryService.create] ERRO', { message: error?.message, code: error?.code, meta: error?.meta });
      // Propagar erros de validação já tratados
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao criar entrada do diário.');
    }
  }

  async findEntriesByUserId(userId: number, lastNDays?: number) {
    const where: any = { userId };
    if (lastNDays) {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - lastNDays);
      fromDate.setHours(0, 0, 0, 0);
      where.date = { gte: fromDate };
    }
    return await this.prisma.diaryEntry.findMany({
      where,
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

  async findAllDiaries(lastDays?: number) {
    const where: any = {};
    if (lastDays) {
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - lastDays);
      where.created_at = { gte: start, lte: now };
    }
    return await this.prisma.diaryEntry.findMany({
      where,
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
      // Energia: Muito bem=2, Neutro=1, outros=0
      if (emocao === 'Muito bem') energiaTotal += 2;
      else if (emocao === 'Neutro') energiaTotal += 1;
      // Estresse: Muito mal/Mal contam como 1
      if (emocao === 'Muito mal' || emocao === 'Mal') estresseTotal += 1;
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
    let dias = 7;
    if (period === 'mes') dias = 30;
    if (period === 'ano') dias = 365;
    let mediaPeriodo = 0;
    let melhorDia = 0;
    if (period === 'semana' || period === 'mes') {
      const dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - (dias - 1));
      const lineLabels: string[] = [];
      const lineData: (number | null)[] = [];
      const emotionMap: { [key: string]: number } = {
        'Muito mal': 1,
        'Mal': 2,
        'Neutro': 3,
        'Bem': 4,
        'Muito bem': 5,
      };
      for (let i = 0; i < dias; i++) {
        const data = new Date(dataInicio);
        data.setDate(dataInicio.getDate() + i);
        const dataStr = data.toISOString().split('T')[0];
        lineLabels.push(dataStr);
        // Busca a ÚLTIMA entrada do dia (maior created_at)
        const entradasDoDia = entries.filter(e => e.date && e.date.toISOString().split('T')[0] === dataStr);
        let entrada = null;
        if (entradasDoDia.length > 0) {
          entrada = entradasDoDia.reduce((latest, curr) => {
            if (!latest) return curr;
            return (curr.created_at > latest.created_at) ? curr : latest;
          }, null);
        }
        if (entrada && entrada.emotion) {
          lineData.push(emotionMap[entrada.emotion] || null);
        } else {
          lineData.push(null);
        }
      }
      // Cálculo da média e melhor dia (considerando só valores válidos)
      const valoresValidos = lineData.filter(v => v !== null) as number[];
      if (valoresValidos.length > 0) {
        mediaPeriodo = Number((valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length).toFixed(1));
        melhorDia = Math.max(...valoresValidos);
      }
      entradasFiltradas = entries.filter((entrada) => {
        if (!entrada.date) return false;
        const data = new Date(entrada.date);
        return data >= dataInicio && data <= hoje;
      });
      for (const entrada of entradasFiltradas) {
        const data = entrada.date ? entrada.date.toISOString().split('T')[0] : 'Sem data';
        const emocao = entrada.emotion || 'Sem emoção';
        if (!agrupado[data]) agrupado[data] = {};
        agrupado[data][emocao] = (agrupado[data][emocao] || 0) + 1;
      }
      labels = lineLabels;
      const emocoesSet = new Set<string>();
      labels.forEach((label) => {
        if (agrupado[label]) {
          Object.keys(agrupado[label]).forEach((e) => emocoesSet.add(e));
        }
      });
      const emocoes = Array.from(emocoesSet);
      const datasets = emocoes.map((emocao) => ({
        label: emocao,
        data: labels.map((label) => agrupado[label]?.[emocao] || 0),
      }));
      return {
        labels,
        datasets,
        lineLabels,
        lineData,
        mediaPeriodo,
        melhorDia,
      };
    } else if (period === 'ano') {
      for (const entrada of entries) {
        if (!entrada.date) continue;
        const ano = new Date(entrada.date).getFullYear().toString();
        const emocao = entrada.emotion || 'Sem emoção';
        if (!agrupado[ano]) agrupado[ano] = {};
        agrupado[ano][emocao] = (agrupado[ano][emocao] || 0) + 1;
      }
      labels = Object.keys(agrupado).sort();
      const emocoesSet = new Set<string>();
      labels.forEach((label) => {
        Object.keys(agrupado[label]).forEach((e) => emocoesSet.add(e));
      });
      const emocoes = Array.from(emocoesSet);
      const datasets = emocoes.map((emocao) => ({
        label: emocao,
        data: labels.map((label) => agrupado[label][emocao] || 0),
      }));
      return {
        labels,
        datasets,
        lineLabels: labels,
        lineData: [],
        mediaPeriodo: 0,
        melhorDia: 0,
      };
    }
    return {
      labels: [],
      datasets: [],
      lineLabels: [],
      lineData: [],
      mediaPeriodo: 0,
      melhorDia: 0,
    };
  }

  /**
   * Retorna a porcentagem de cada emoção (triste, frustrado, neutro, tranquilo, realizado)
   * nas entradas do diário. Ideal para indicadores circulares no dashboard.
   */
  async getEmotionPercentages() {
    // Emoções padronizadas e seus emojis/labels
    const EMOTIONS = [
      { key: 'Muito mal', label: 'Muito mal', emoji: '😢' },
      { key: 'Mal', label: 'Mal', emoji: '😠' },
      { key: 'Neutro', label: 'Neutro', emoji: '😐' },
      { key: 'Bem', label: 'Bem', emoji: '🙂' },
      { key: 'Muito bem', label: 'Muito bem', emoji: '😃' },
    ];
    // Busca todas as entradas
    const entries = await this.prisma.diaryEntry.findMany();
    const total = entries.length;
    // Conta cada emoção
    const counts: { [key: string]: number } = {};
    for (const { emotion } of entries) {
      if (emotion && EMOTIONS.some(e => e.key === emotion)) {
        counts[emotion] = (counts[emotion] || 0) + 1;
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
