import { Customer } from '../../domain/types';

export interface CreateCustomerDTO {
  type: string;
  name: string;
  legalName?: string;
  documentType?: string;
  document?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  state?: string;
  status?: string;
  defaultPaymentTermsDays?: number;
  creditLimit?: number;
  notes?: string;
  tags?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postalCode?: string;
    country?: string;
  };
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {}

export interface ICustomerRepository {
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  createCustomer(data: CreateCustomerDTO): Promise<Customer>;
  updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  getCustomerBalance(id: string): Promise<{openReceivables: number; consignmentBalance: number; totalExposure: number;}>;
  getCustomerActivity(id: string): Promise<{id: string; type: string; date: string; description: string;}[]>;
}
