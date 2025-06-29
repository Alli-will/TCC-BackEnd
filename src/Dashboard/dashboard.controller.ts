import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/JwtAuthGuard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserService } from '../user/user.service';
import { DiaryService } from '../DiaryEntry/Diary/diary.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly userService: UserService,
    private readonly diaryService: DiaryService,
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
    // Busca todos os usuários e diários
    const users = await this.userService.findAll();
    const diaries = await this.diaryService.findAllDiaries();

    // Mapeia colaboradores
    const emotionEssScore: { [key: string]: number } = {
      'Muito bem': 5,
      'Bem': 4,
      'Neutro': 3,
      'Mal': 2,
      'Muito mal': 1
    };
    // Função para buscar nome do departamento pelo id
    function getDepartmentName(user: any): string {
      return user.department?.name || user.departmentName || 'Sem departamento';
    }
    const colaboradores = users.map(user => {
      const diarios = diaries.filter((e: any) => e.userId === user.id);
      let bemEstar = 0;
      let departamento = getDepartmentName(user);
      if (diarios.length) {
        // Se o diário trouxer o departamento, prioriza ele
        const diarioComDepto = diarios.find((d: any) => d.user?.department?.name);
        if (diarioComDepto) {
          departamento = diarioComDepto.user.department.name;
        }
        const valores = diarios.map((d: any) => {
          if (typeof d.bemEstar === 'number') return d.bemEstar;
          if (typeof d.emotion === 'string') {
            const emo = d.emotion; // Removido .toLowerCase()
            return emotionEssScore[emo] ?? 3;
          }
          return 0;
        });
        bemEstar = +(valores.reduce((acc: number, d: number) => acc + d, 0) / valores.length).toFixed(1);
      }
      const risco = bemEstar < 3;
      return {
        id: user.id,
        nome: `${user.first_Name || ''} ${user.last_Name || ''}`.trim(),
        departamento,
        bemEstar: diarios.length ? bemEstar : 0,
        risco,
      };
    });
    // Métricas gerais
    const metricas = {
      ativos: users.length,
      bemEstarGeral: +(colaboradores.reduce((acc, c) => acc + c.bemEstar, 0) / (colaboradores.length || 1)).toFixed(1),
      altoRisco: colaboradores.filter((c) => c.risco).length,
      altoRiscoPercent: users.length ? Math.round((colaboradores.filter((c) => c.risco).length / users.length) * 100) : 0,
      totalRespostasDiario: diaries.length, // novo indicador
    };
    // Departamentos
    const departamentosMap = new Map<string, number[]>();
    colaboradores.forEach((c) => {
      if (c.departamento === 'Sem departamento') return;
      if (!departamentosMap.has(c.departamento)) departamentosMap.set(c.departamento, []);
      departamentosMap.get(c.departamento)!.push(c.bemEstar);
    });
    const departamentos = Array.from(departamentosMap.entries()).map(([nome, arr]) => ({
      nome,
      mediaBemEstar: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
    }));
    // Colaboradores em risco
    const colaboradoresEmRisco = colaboradores.filter((c) => c.risco);
    return {
      metricas,
      colaboradores,
      departamentos,
      colaboradoresEmRisco
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
    // Busca apenas os últimos 30 dias
    const diaries = await this.diaryService.findAllDiaries(30);
    const emotionEssScore: { [key: string]: number } = {
      'Muito bem': 5,
      'Bem': 4,
      'Neutro': 3,
      'Mal': 2,
      'Muito mal': 1
    };
    const valores: number[] = [];
    diaries.forEach((d: any) => {
      if (typeof d.bemEstar === 'number') {
        valores.push(d.bemEstar);
      } else if (typeof d.emotion === 'string') {
        const emo = d.emotion;
        valores.push(emotionEssScore[emo] ?? 3);
      }
    });
    const soma = valores.reduce((acc: number, d: number) => acc + d, 0);
    const media = valores.length > 0 ? soma / valores.length : 0;
    const ess = Math.round((media / 5) * 100);
    return { ess, valores };
  }
}
