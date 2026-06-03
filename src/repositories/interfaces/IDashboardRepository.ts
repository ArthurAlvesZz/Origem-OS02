import { DashboardSummary, DashboardAlert, DashboardActivity } from '../../domain/types';

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummary>;
  getAlerts(): Promise<DashboardAlert[]>;
  getRecentActivity(): Promise<DashboardActivity[]>;
}
