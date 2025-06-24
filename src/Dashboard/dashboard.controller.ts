import { Controller, Get, UseGuards } from '@nestjs/common';
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
    const emotionMap: { [key: string]: number } = {
      'feliz': 10, 'alegre': 9, 'motivado': 8, 'ok': 7, 'neutro': 6,
      'ansioso': 4, 'cansado': 3, 'triste': 2, 'tristeza': 2, 'depressivo': 1, 'depressão': 1,
      'raiva': 2, 'preocupado': 3, 'exausto': 2, 'estressado': 3, 'ansiedade': 3, 'irritado': 2
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
            const emo = d.emotion.toLowerCase();
            return emotionMap[emo] ?? 5;
          }
          return 0;
        });
        bemEstar = +(valores.reduce((acc: number, d: number) => acc + d, 0) / valores.length).toFixed(1);
      }
      const risco = bemEstar < 4;
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
}
