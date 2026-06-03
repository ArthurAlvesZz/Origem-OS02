import { IDashboardRepository } from '../interfaces/IDashboardRepository';
import { DashboardSummary, DashboardAlert, DashboardActivity } from '../../domain/types';

export class MockDashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    return {
      faturamentoMes: 42400,
      metaFaturamento: 55000,
      receitaRecebida: 38000,
      contasReceber: 5300,
      contasPagar: 12000,
      lucroEstimado: 14840,
      margemBruta: 35.0,
      estoqueCritico: 2,
      consignacoesAbertas: 5,
      consignacoesVencidas: 1,
      producaoMes: 450,
      custoProducao: 12000,
      pedidosMes: 25
    };
  }

  async getAlerts(): Promise<DashboardAlert[]> {
    return [
      {
        id: '1',
        type: 'consignacao_vencida',
        title: 'Acerto de Consignação',
        message: 'Empório Central vence hoje. 30 pacotes de Cerrado pendentes.',
        severity: 'medium'
      },
      {
        id: '2',
        type: 'estoque_baixo',
        title: 'Falta de Embalagem',
        message: 'Caixas de embarque (120 unid) abaixo do mínimo para as próximas torras.',
        severity: 'high'
      },
      {
        id: '3',
        type: 'outro',
        title: 'Pré-Notas Prontas',
        message: 'Existem 2 Pedidos B2B pagos aguardando NFE (integração futura).',
        severity: 'low'
      }
    ];
  }

  async getRecentActivity(): Promise<DashboardActivity[]> {
    return [
      {
        id: '1',
        date: new Date().toISOString(),
        message: 'Pedido #123 criado.',
        type: 'pedido'
      }
    ];
  }
}
