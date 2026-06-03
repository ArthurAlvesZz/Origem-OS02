import { TenantProfile, Branch, BusinessRules, ProductionRules, ModuleFlags } from '../../domain/types';

export interface ISettingsRepository {
  getProfile(): Promise<TenantProfile>;
  updateProfile(data: Partial<TenantProfile>): Promise<TenantProfile>;
  
  getBranches(): Promise<Branch[]>;
  createBranch(data: Partial<Branch>): Promise<Branch>;
  updateBranch(id: string, data: Partial<Branch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;
  
  getBusinessRules(): Promise<BusinessRules>;
  updateBusinessRules(data: Partial<BusinessRules>): Promise<BusinessRules>;

  getProductionRules(): Promise<ProductionRules>;
  updateProductionRules(data: Partial<ProductionRules>): Promise<ProductionRules>;

  getModuleFlags(): Promise<ModuleFlags>;
  updateModuleFlags(data: Partial<ModuleFlags>): Promise<ModuleFlags>;
}
