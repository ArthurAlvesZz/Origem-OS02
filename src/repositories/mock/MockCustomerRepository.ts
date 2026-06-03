import { ICustomerRepository, CreateCustomerDTO, UpdateCustomerDTO } from '../interfaces/ICustomerRepository';
import { Customer } from '../../domain/types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    type: 'b2b',
    name: 'Empório Central',
    legalName: 'Empório Central Ltda',
    documentType: 'cnpj',
    document: '12.345.678/0001-90',
    email: 'contato@emporiocentral.com.br',
    phone: '11999999999',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    defaultPaymentTermsDays: 30,
    creditLimit: 5000,
  },
  {
    id: '2',
    type: 'b2c',
    name: 'João Silva',
    documentType: 'cpf',
    document: '123.456.789-00',
    email: 'joao.silva@email.com',
    phone: '11988888888',
    city: 'Campinas',
    state: 'SP',
    status: 'active',
    defaultPaymentTermsDays: 0,
  },
  {
    id: '3',
    type: 'partner',
    name: 'Cafeteria do Seu Zé',
    documentType: 'cnpj',
    document: '98.765.432/0001-10',
    email: 'ze@cafeteria.com',
    city: 'Belo Horizonte',
    state: 'MG',
    status: 'active',
    defaultPaymentTermsDays: 15,
  }
];

export class MockCustomerRepository implements ICustomerRepository {
  async getCustomers(): Promise<Customer[]> {
    return [...mockCustomers];
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return mockCustomers.find(c => c.id === id);
  }

  async createCustomer(data: CreateCustomerDTO): Promise<Customer> {
    const newCustomer: Customer = {
      id: Math.random().toString(36).substring(7),
      ...data,
      type: data.type || 'b2c',
      documentType: data.documentType || 'none',
      status: data.status || 'active',
      defaultPaymentTermsDays: data.defaultPaymentTermsDays || 0
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Cliente não encontrado');
    
    mockCustomers[idx] = { ...mockCustomers[idx], ...data };
    return mockCustomers[idx];
  }

  async deleteCustomer(id: string): Promise<void> {
    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockCustomers.splice(idx, 1);
    }
  }

  async getCustomerBalance(id: string) {
    return {
      openReceivables: 1250,
      consignmentBalance: 500,
      totalExposure: 1750
    };
  }

  async getCustomerActivity(id: string) {
    return [
      {
        id: '1',
        type: 'pedido',
        date: new Date().toISOString(),
        description: 'Pedido #123 - R$ 1250.00 (pending)'
      }
    ];
  }
}
