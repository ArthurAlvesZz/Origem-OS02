export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  score: number;
  active: boolean;
}

export interface CustomerAddress {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  type: string; // b2c, b2b, partner, supplier
  name: string;
  legalName?: string;
  documentType: string;
  document?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  status: string; // active, inactive, blocked
  defaultPaymentTermsDays: number;
  creditLimit?: number;
  notes?: string;
  tags?: string;
  addresses?: CustomerAddress[];
  totalOrders?: number; // legacy frontend use sometimes
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
}

export type OrderStatus = 'Pago' | 'Pendente' | 'Parcial';

export interface Order {
  id: string;
  date: string;
  customer: string; // name
  total: number;
  status: string;
  method: string;
  items: number;
}

export type MovementType = 'Entrada' | 'Saída' | 'Ajuste' | 'Perda';

export type ConsignmentStatus = 'Aberta' | 'Vencendo' | 'Vencida' | 'Parcial' | 'Fechada';

export type ProductionStatus = 'Rascunho' | 'Em Produção' | 'Concluído' | 'Cancelado';

export interface ProductionInput {
  productId: string;
  name: string;
  qty: number;
  unitCost: number;
}

export interface ProductionExtraCost {
  description: string;
  amount: number;
}

export interface ProductionBatch {
  id: string;
  code: string;
  date: string;
  finalProductId: string;
  finalProductName: string;
  status: ProductionStatus;
  
  initialWeight: number;
  finalWeight: number;
  finalQty: number;
  
  yieldPercent: number;
  lossPercent: number;
  
  inputs: ProductionInput[];
  extraCosts: ProductionExtraCost[];
  qualityReviews?: any[];
  
  hours: number;
  laborCostPerHour: number;
  
  totalInputCost: number;
  totalLaborCost: number;
  totalExtraCost: number;
  totalCost: number;
  
  unitCost: number;
  
  responsible: string;
  notes: string;
}

export type TransactionType = 'Receita' | 'Despesa';
export type TransactionStatus = 'Efetivado' | 'Agendado' | 'Atrasado';

export interface FinancialTransaction {
  id: string;
  date: string; // dueDate or paidDate
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  paymentMethod?: string;
}

export interface ConsignmentItem {
  productId: string;
  name: string;
  qtySent: number;
  qtySold: number;
  qtyReturned: number;
  qtyLost: number;
  unitPrice: number;
  unitCost: number;
}

export interface Consignment {
  id: string;
  partnerId: string;
  partnerName: string;
  sentDate: string;
  dueDate: string;
  status: ConsignmentStatus;
  items: ConsignmentItem[];
  expectedTotal: number;
  soldTotal: number;
}

export interface Partner extends Customer {
  defaultTermDays?: number;
}


export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  product: string; // Simplificando para bater com os mocks
  qty: number;
  reason: string;
}

export interface Lot {
  id: string;
  code: string;
  productId: string;
  productName: string;
  qty: number;
  entryDate: string;
  expiryDate: string;
  cost: number;
  note: string;
}

export interface TenantProfile {
  name: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  language: string;
}

export interface Branch {
  id: string;
  name: string;
  type: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  status: string;
}

export interface BusinessRules {
  defaultB2CPaymentTermsDays: number;
  defaultB2BPaymentTermsDays: number;
  defaultConsignmentSettleDays: number;
  allowNegativeStock: boolean;
  defaultDiscountLimitPercent: number;
  monthlyRevenueTarget: number;
  defaultSalesChannel?: string;
  defaultPaymentMethod?: string;
}

export interface ProductionRules {
  defaultHourCost: number;
  masterRoasterHourCost: number;
  minExpectedYieldPercent: number;
  maxExpectedLossPercent: number;
  defaultUnit: string;
}

export interface ModuleFlags {
  sales: boolean;
  inventory: boolean;
  finance: boolean;
  production: boolean;
  consignment: boolean;
  fiscal_placeholder: boolean;
  payroll_placeholder: boolean;
  storefront_placeholder: boolean;
}

export interface DashboardSummary {
  faturamentoMes: number;
  metaFaturamento: number;
  receitaRecebida: number;
  contasReceber: number;
  contasPagar: number;
  lucroEstimado: number;
  margemBruta: number;
  estoqueCritico: number;
  consignacoesAbertas: number;
  consignacoesVencidas: number;
  producaoMes: number;
  custoProducao: number;
  pedidosMes: number;
}

export interface DashboardAlert {
  id: string;
  type: 'estoque_baixo' | 'conta_vencida' | 'consignacao_vencida' | 'producao_aberta' | 'outro';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DashboardActivity {
  id: string;
  date: string;
  message: string;
  type: 'pedido' | 'estoque' | 'consignacao' | 'producao' | 'financeiro';
}

export interface GeneratedDocument {
  id: string;
  type: string;
  status: string;
  sequenceNumber: number;
  referenceType?: string;
  referenceId?: string;
  customerId?: string;
  periodStart?: string;
  periodEnd?: string;
  title: string;
  snapshotJson: any;
  generatedByUserId: string;
  generatedAt: string;
  voidedAt?: string;
  createdAt?: string;
}

export interface PublicLotTrace {
  id: string;
  tenantId: string;
  qualityReviewId: string;
  productionBatchId?: string | null;
  productId?: string | null;
  publicCode: string;
  status: string;
  title: string;
  summary?: string | null;
  publicScore?: number | null;
  publicDescriptorsJson?: string | null;
  publicOriginJson?: string | null;
  roastInfoJson?: string | null;
  productInfoJson?: string | null;
  qrUrl?: string | null;
  publishedAt?: string | null;
  unpublishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  
  review?: any; // QualityReview
  batch?: any;  // ProductionBatch
  product?: Product;
}
