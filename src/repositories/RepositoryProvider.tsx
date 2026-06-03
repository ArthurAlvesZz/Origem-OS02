import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { IProductRepository } from './interfaces/IProductRepository';
import { IOrderRepository } from './interfaces/IOrderRepository';
import { IInventoryRepository } from './interfaces/IInventoryRepository';
import { IConsignmentRepository } from './interfaces/IConsignmentRepository';
import { IProductionRepository } from './interfaces/IProductionRepository';
import { IFinancialRepository } from './interfaces/IFinancialRepository';
import { IDashboardRepository } from './interfaces/IDashboardRepository';
import { ICustomerRepository } from './interfaces/ICustomerRepository';
import { ISettingsRepository } from './interfaces/ISettingsRepository';
import { IReportsRepository } from './interfaces/IReportsRepository';

import { MockProductRepository } from './mock/MockProductRepository';
import { MockOrderRepository } from './mock/MockOrderRepository';
import { MockInventoryRepository } from './mock/MockInventoryRepository';
import { MockConsignmentRepository } from './mock/MockConsignmentRepository';
import { MockProductionRepository } from './mock/MockProductionRepository';
import { MockFinancialRepository } from './mock/MockFinancialRepository';
import { MockDashboardRepository } from './mock/MockDashboardRepository';
import { MockCustomerRepository } from './mock/MockCustomerRepository';
import { MockSettingsRepository } from './mock/MockSettingsRepository';
import { MockReportsRepository } from './mock/MockReportsRepository';
import { MockTeamRepository } from './mock/MockTeamRepository';
import { MockStorefrontRepository } from './mock/MockStorefrontRepository';
import { MockPaymentRepository } from './mock/MockPaymentRepository';
import { MockCrmRepository } from './mock/MockCrmRepository';
import { MockAdvancedProductionRepository } from './mock/MockAdvancedProductionRepository';
import { MockB2BCatalogRepository } from './mock/MockB2BCatalogRepository';
import { MockQualityRepository } from './mock/MockQualityRepository';
import { MockTraceabilityRepository } from './mock/MockTraceabilityRepository';
import { MockDigitalMenuRepository } from './mock/MockDigitalMenuRepository';

import { ApiProductRepository } from './api/ApiProductRepository';
import { ApiInventoryRepository } from './api/ApiInventoryRepository';
import { ApiOrderRepository } from './api/ApiOrderRepository';
import { ApiFinancialRepository } from './api/ApiFinancialRepository';
import { ApiProductionRepository } from './api/ApiProductionRepository';
import { ApiConsignmentRepository } from './api/ApiConsignmentRepository';
import { ApiDashboardRepository } from './api/ApiDashboardRepository';
import { ApiCustomerRepository } from './api/ApiCustomerRepository';
import { ApiSettingsRepository } from './api/ApiSettingsRepository';
import { ApiReportsRepository } from './api/ApiReportsRepository';
import { ApiTeamRepository } from './api/ApiTeamRepository';
import { ApiStorefrontRepository } from './api/ApiStorefrontRepository';
import { ApiPaymentRepository } from './api/ApiPaymentRepository';
import { ApiCrmRepository } from './api/ApiCrmRepository';
import { ApiAdvancedProductionRepository } from './api/ApiAdvancedProductionRepository';
import { ApiB2BCatalogRepository } from './api/ApiB2BCatalogRepository';
import { ApiQualityRepository } from './api/ApiQualityRepository';
import { ApiTraceabilityRepository } from './api/ApiTraceabilityRepository';
import { ApiDigitalMenuRepository } from './api/ApiDigitalMenuRepository';

import { ITeamRepository } from './interfaces/ITeamRepository';
import { IStorefrontRepository } from './interfaces/IStorefrontRepository';
import { IPaymentRepository } from './interfaces/IPaymentRepository';
import { ICrmRepository } from './interfaces/ICrmRepository';
import { IAdvancedProductionRepository } from './interfaces/IAdvancedProductionRepository';
import { IB2BCatalogRepository } from './interfaces/IB2BCatalogRepository';
import { IQualityRepository } from './interfaces/IQualityRepository';
import { ITraceabilityRepository } from './interfaces/ITraceabilityRepository';
import { IDigitalMenuRepository } from './interfaces/IDigitalMenuRepository';

import { safeFetch } from './api/apiClient';

export type DataProviderType = 'mock' | 'api';

interface Repositories {
  productRepo: IProductRepository;
  orderRepo: IOrderRepository;
  inventoryRepo: IInventoryRepository;
  consignmentRepo: IConsignmentRepository;
  productionRepo: IProductionRepository;
  financialRepo: IFinancialRepository;
  dashboardRepo: IDashboardRepository;
  customerRepo: ICustomerRepository;
  settingsRepo: ISettingsRepository;
  reportsRepo: IReportsRepository;
  teamRepo: ITeamRepository;
  storefrontRepo: IStorefrontRepository;
  paymentRepo: IPaymentRepository;
  crmRepo: ICrmRepository;
  advancedProductionRepo: IAdvancedProductionRepository;
  b2bCatalogRepo: IB2BCatalogRepository;
  qualityRepo: IQualityRepository;
  traceabilityRepo: ITraceabilityRepository;
  digitalMenuRepo: IDigitalMenuRepository;
  actualType: DataProviderType;
}

const RepositoryContext = createContext<Repositories | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
  providerType?: DataProviderType;
  onFallbackToMock?: () => void;
}

export function RepositoryProvider({ children, providerType = 'mock', onFallbackToMock }: ProviderProps) {
  const [actualType, setActualType] = useState<DataProviderType>(providerType);
  const [isInitializing, setIsInitializing] = useState(providerType === 'api');

  useEffect(() => {
    if (providerType === 'api') {
      safeFetch('/api/health')
        .then(data => {
          if (data.status !== 'ok') {
            console.warn('API DB unhealthy');
            if (process.env.NODE_ENV === 'development') setActualType('mock');
            if (onFallbackToMock) onFallbackToMock();
          } else {
            setActualType('api');
          }
        })
        .catch(err => {
          console.warn('Failed to reach API', err);
          if (process.env.NODE_ENV === 'development') setActualType('mock');
          if (onFallbackToMock) onFallbackToMock();
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setActualType('mock');
    }
  }, [providerType, onFallbackToMock]);

  // In the future, this switch allows instantiating ApiRepositories instead
  const repos: Repositories = actualType === 'mock' ? {
    productRepo: new MockProductRepository(),
    orderRepo: new MockOrderRepository(),
    inventoryRepo: new MockInventoryRepository(),
    consignmentRepo: new MockConsignmentRepository(),
    productionRepo: new MockProductionRepository(),
    financialRepo: new MockFinancialRepository(),
    dashboardRepo: new MockDashboardRepository(),
    customerRepo: new MockCustomerRepository(),
    settingsRepo: new MockSettingsRepository(),
    reportsRepo: new MockReportsRepository(),
    teamRepo: new MockTeamRepository(),
    storefrontRepo: new MockStorefrontRepository(),
    paymentRepo: new MockPaymentRepository(),
    crmRepo: new MockCrmRepository(),
    advancedProductionRepo: new MockAdvancedProductionRepository(),
    b2bCatalogRepo: new MockB2BCatalogRepository(),
    qualityRepo: new MockQualityRepository(),
    traceabilityRepo: new MockTraceabilityRepository(),
    digitalMenuRepo: new MockDigitalMenuRepository(),
    actualType
  } : {
    productRepo: new ApiProductRepository(),
    orderRepo: new ApiOrderRepository(),
    inventoryRepo: new ApiInventoryRepository(),
    consignmentRepo: new ApiConsignmentRepository(),
    productionRepo: new ApiProductionRepository(),
    financialRepo: new ApiFinancialRepository(),
    dashboardRepo: new ApiDashboardRepository(),
    customerRepo: new ApiCustomerRepository(),
    settingsRepo: new ApiSettingsRepository(),
    reportsRepo: new ApiReportsRepository(),
    teamRepo: new ApiTeamRepository(),
    storefrontRepo: new ApiStorefrontRepository(),
    paymentRepo: new ApiPaymentRepository(),
    crmRepo: new ApiCrmRepository(),
    advancedProductionRepo: new ApiAdvancedProductionRepository(),
    b2bCatalogRepo: new ApiB2BCatalogRepository(),
    qualityRepo: new ApiQualityRepository(),
    traceabilityRepo: new ApiTraceabilityRepository(),
    digitalMenuRepo: new ApiDigitalMenuRepository(),
    actualType
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
         <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p className="text-sm font-medium tracking-wide">Iniciando Ambiente</p>
      </div>
    );
  }

  return (
    <RepositoryContext.Provider value={repos}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
}
