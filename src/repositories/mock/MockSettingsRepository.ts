import { ISettingsRepository } from '../interfaces/ISettingsRepository';
import { TenantProfile, Branch, BusinessRules, ProductionRules, ModuleFlags } from '../../domain/types';

let mockProfile: TenantProfile = {
  name: 'COFCOF.CO',
  legalName: 'COFCOF Torrefacao e Comercio Ltda',
  document: '12.345.678/0001-99',
  email: 'contato@cofcof.co',
  phone: '11999999999',
  whatsapp: '11999999999',
  address: 'Rua do Cafe, 123 - Centro, Sao Paulo - SP',
  logoUrl: '',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  language: 'pt-BR'
};

let mockBranches: Branch[] = [
  {
    id: '1',
    name: 'Matriz - Torrefação',
    type: 'torrefacao',
    street: 'Rua do Cafe',
    number: '123',
    city: 'Sao Paulo',
    state: 'SP',
    country: 'BR',
    isDefault: true,
    status: 'active'
  }
];

let mockBusinessRules: BusinessRules = {
  defaultB2CPaymentTermsDays: 0,
  defaultB2BPaymentTermsDays: 30,
  defaultConsignmentSettleDays: 15,
  allowNegativeStock: false,
  defaultDiscountLimitPercent: 10,
  monthlyRevenueTarget: 50000,
  defaultSalesChannel: 'Whatsapp',
  defaultPaymentMethod: 'PIX'
};

let mockProductionRules: ProductionRules = {
  defaultHourCost: 45,
  masterRoasterHourCost: 80,
  minExpectedYieldPercent: 82,
  maxExpectedLossPercent: 18,
  defaultUnit: 'kg'
};

let mockModuleFlags: ModuleFlags = {
  sales: true,
  inventory: true,
  finance: true,
  production: true,
  consignment: true,
  fiscal_placeholder: false,
  payroll_placeholder: false,
  storefront_placeholder: false
};

export class MockSettingsRepository implements ISettingsRepository {
  async getProfile() { return { ...mockProfile }; }
  async updateProfile(data: Partial<TenantProfile>) {
    mockProfile = { ...mockProfile, ...data };
    return { ...mockProfile };
  }

  async getBranches() { return [...mockBranches]; }
  async createBranch(data: Partial<Branch>) {
    const newBranch = { 
      ...data, 
      id: Math.random().toString(36).substring(7),
      isDefault: data.isDefault || false,
      status: data.status || 'active',
      country: data.country || 'BR',
      type: data.type || 'loja',
      name: data.name!
    } as Branch;
    mockBranches.push(newBranch);
    return newBranch;
  }
  async updateBranch(id: string, data: Partial<Branch>) {
    const idx = mockBranches.findIndex(b => b.id === id);
    if(idx === -1) throw new Error('Branch not found');
    mockBranches[idx] = { ...mockBranches[idx], ...data };
    return { ...mockBranches[idx] };
  }
  async deleteBranch(id: string) {
    mockBranches = mockBranches.filter(b => b.id !== id);
  }

  async getBusinessRules() { return { ...mockBusinessRules }; }
  async updateBusinessRules(data: Partial<BusinessRules>) {
    mockBusinessRules = { ...mockBusinessRules, ...data };
    return { ...mockBusinessRules };
  }

  async getProductionRules() { return { ...mockProductionRules }; }
  async updateProductionRules(data: Partial<ProductionRules>) {
    mockProductionRules = { ...mockProductionRules, ...data };
    return { ...mockProductionRules };
  }

  async getModuleFlags() { return { ...mockModuleFlags }; }
  async updateModuleFlags(data: Partial<ModuleFlags>) {
    mockModuleFlags = { ...mockModuleFlags, ...data };
    return { ...mockModuleFlags };
  }
}
