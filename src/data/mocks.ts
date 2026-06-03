export const products = [
  { id: '1', sku: 'CERR-250-NAT', name: 'Cerrado Natural 250g', category: 'Café Torrado', price: 45.00, cost: 18.50, stock: 120, minStock: 30, unit: 'un', score: 86, active: true },
  { id: '2', sku: 'CERR-1KG-NAT', name: 'Cerrado Natural 1kg', category: 'Café Torrado', price: 140.00, cost: 65.00, stock: 45, minStock: 15, unit: 'un', score: 86, active: true },
  { id: '3', sku: 'MANT-250-LAV', name: 'Mantiqueira Lavado 250g', category: 'Café Torrado', price: 55.00, cost: 22.00, stock: 8, minStock: 20, unit: 'un', score: 88.5, active: true },
  { id: '4', sku: 'GRAO-CRU-CERR', name: 'Grão Cru Cerrado', category: 'Insumo', price: 0, cost: 35.00, stock: 450, minStock: 120, unit: 'kg', score: 86, active: true }
];

export const customers = [
  { id: 'c1', name: 'Empório do Grão', type: 'B2B', status: 'Ativo', totalOrders: 14 },
  { id: 'c2', name: 'Padaria Artesanal SP', type: 'B2B', status: 'Ativo', totalOrders: 8 },
  { id: 'c3', name: 'Cliente Avulso (PDV)', type: 'B2C', status: 'Ativo', totalOrders: 156 }
];

export const orders = [
  { id: 'ORD-1042', date: '2026-06-01T10:30:00Z', customer: 'Empório do Grão', total: 680.00, status: 'Pago', method: 'PIX', items: 2 },
  { id: 'ORD-1043', date: '2026-06-01T11:15:00Z', customer: 'Cliente Avulso (PDV)', total: 90.00, status: 'Pago', method: 'Cartão de Crédito', items: 2 },
  { id: 'ORD-1044', date: '2026-06-01T14:20:00Z', customer: 'Padaria Artesanal SP', total: 1400.00, status: 'Pendente', method: 'Boleto 30d', items: 4 }
];

export const partners = [
  { id: 'p1', name: 'Empório do Grão', type: 'Revenda', status: 'Ativo', defaultTermDays: 30 },
  { id: 'p2', name: 'Padaria Artesanal SP', type: 'Revenda', status: 'Ativo', defaultTermDays: 15 },
  { id: 'p3', name: 'Hotel Premium Resort', type: 'Hospedagem', status: 'Ativo', defaultTermDays: 45 }
];

export const consignments = [
  { 
    id: 'CSG-001', 
    partnerId: 'p1',
    partnerName: 'Empório do Grão', 
    sentDate: '2026-05-01', 
    dueDate: '2026-06-01', 
    status: 'Vencendo',
    expectedTotal: 1350.00,
    soldTotal: 0,
    items: [
      { productId: '1', name: 'Cerrado Natural 250g', qtySent: 30, qtySold: 0, qtyReturned: 0, qtyLost: 0, unitPrice: 45.0, unitCost: 18.5 }
    ]
  },
  { 
    id: 'CSG-002', 
    partnerId: 'p2',
    partnerName: 'Padaria Artesanal SP', 
    sentDate: '2026-05-15', 
    dueDate: '2026-06-15', 
    status: 'Aberta',
    expectedTotal: 900.00,
    soldTotal: 0,
    items: [
      { productId: '1', name: 'Cerrado Natural 250g', qtySent: 20, qtySold: 0, qtyReturned: 0, qtyLost: 0, unitPrice: 45.0, unitCost: 18.5 }
    ]
  },
  { 
    id: 'CSG-003',
    partnerId: 'p3', 
    partnerName: 'Hotel Premium Resort', 
    sentDate: '2026-04-10', 
    dueDate: '2026-05-10', 
    status: 'Fechada',
    expectedTotal: 1800.00,
    soldTotal: 1575.00,
    items: [
      { productId: '2', name: 'Cerrado Natural 1kg', qtySent: 10, qtySold: 10, qtyReturned: 0, qtyLost: 0, unitPrice: 140.0, unitCost: 65.0 },
      { productId: '3', name: 'Mantiqueira Lavado 250g', qtySent: 10, qtySold: 5, qtyReturned: 5, qtyLost: 0, unitPrice: 55.0, unitCost: 22.0 }
    ]
  }
] as any[];

export const stockMovements = [
  { id: 'MOV-998', date: '2026-06-01', type: 'Saída', product: 'Cerrado Natural 250g', qty: -10, reason: 'Venda B2B' },
  { id: 'MOV-999', date: '2026-06-01', type: 'Saída', product: 'Mantiqueira Lavado 250g', qty: -5, reason: 'Consignação' },
  { id: 'MOV-1000', date: '2026-05-31', type: 'Entrada', product: 'Cerrado Natural 250g', qty: 50, reason: 'Torra Lote #46' },
  { id: 'MOV-1001', date: '2026-05-31', type: 'Saída', product: 'Grão Cru Cerrado', qty: -60, reason: 'Insumo lote #46' }
] as any[];

export const lots = [
  { id: 'L-001', code: 'LT-046', productId: '1', productName: 'Cerrado Natural 250g', qty: 50, entryDate: '2026-05-31', expiryDate: '2026-11-30', cost: 18.5, note: 'Torra de maio' },
  { id: 'L-002', code: 'LT-045', productId: '3', productName: 'Mantiqueira Lavado 250g', qty: 10, entryDate: '2026-04-10', expiryDate: '2026-06-10', cost: 22.0, note: 'Vencendo em breve' }
] as any[];

export const productionBatches = [
  { 
    id: 'PRD-046', 
    code: 'TR-046', 
    date: '2026-05-31', 
    finalProductId: '1', 
    finalProductName: 'Cerrado Natural 250g', 
    status: 'Concluído',
    initialWeight: 60,
    finalWeight: 50.4,
    finalQty: 201, // 50.4 kg / 0.25 kg
    yieldPercent: 84,
    lossPercent: 16,
    inputs: [
      { productId: '4', name: 'Grão Cru Cerrado', qty: 60, unitCost: 35.00 }
    ],
    extraCosts: [
      { description: 'Embalagens 250g', amount: 30.15 },
      { description: 'Etiquetas', amount: 10.05 }
    ],
    hours: 2.5,
    laborCostPerHour: 25.00,
    totalInputCost: 2100.00,
    totalLaborCost: 62.50,
    totalExtraCost: 40.20,
    totalCost: 2202.70,
    unitCost: 10.95,
    responsible: 'Mestre Caio',
    notes: 'Torra padrão, perda normal.'
  },
  { 
    id: 'PRD-047', 
    code: 'TR-047', 
    date: '2026-06-01', 
    finalProductId: '3', 
    finalProductName: 'Mantiqueira Lavado 250g', 
    status: 'Em Produção',
    initialWeight: 15,
    finalWeight: 0,
    finalQty: 0,
    yieldPercent: 0,
    lossPercent: 0,
    inputs: [
      { productId: '4', name: 'Grão Cru Cerrado', qty: 15, unitCost: 35.00 } // Should be Mantiqueira but using what we have
    ],
    extraCosts: [],
    hours: 0,
    laborCostPerHour: 25.00,
    totalInputCost: 525.00,
    totalLaborCost: 0,
    totalExtraCost: 0,
    totalCost: 525.00,
    unitCost: 0,
    responsible: 'Mestre Caio',
    notes: 'Iniciando fase de secagem.'
  }
] as any[];

import { FinancialTransaction } from '../domain/types';

export const financialTransactions: FinancialTransaction[] = [
  { id: 'FIN-201', date: '2026-06-01', description: 'Venda Balcão', amount: 680.00, type: 'Receita', status: 'Efetivado', category: 'Vendas', paymentMethod: 'PIX' },
  { id: 'FIN-202', date: '2026-06-01', description: 'Consignação Empório', amount: 900.00, type: 'Receita', status: 'Agendado', category: 'Consignação', paymentMethod: 'Boleto 30d' },
  { id: 'FIN-203', date: '2026-06-05', description: 'Fornecedor Embalagens', amount: 450.00, type: 'Despesa', status: 'Agendado', category: 'Embalagem' },
  { id: 'FIN-204', date: '2026-05-10', description: 'Energia Elétrica', amount: 320.00, type: 'Despesa', status: 'Atrasado', category: 'Energia' },
  { id: 'FIN-205', date: '2026-05-30', description: 'Salários', amount: 3500.00, type: 'Despesa', status: 'Efetivado', category: 'Mão de obra' },
  { id: 'FIN-206', date: '2026-06-15', description: 'Venda Assinatura', amount: 1400.00, type: 'Receita', status: 'Agendado', category: 'Vendas', paymentMethod: 'Cartão' },
];
