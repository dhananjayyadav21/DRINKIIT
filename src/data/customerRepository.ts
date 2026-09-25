import { JsonCollection } from './jsonStore';
import { Customer } from '@/types/customer';

const customers = new JsonCollection<Customer>('customers.json');

export function findByWaId(waId: string): Customer | null {
  return customers.findOne((c) => c.waId === waId);
}

export function findById(id: string): Customer | null {
  return customers.findById(id);
}

export function create({ waId, name }: { waId: string; name?: string | null }): Promise<Customer> {
  return customers.insert({
    waId,
    name: name || null,
    state: 'NEW',
    currentOrder: null,
    pendingProduct: null,
  });
}

export function save(customer: Customer): Promise<Customer> {
  return customers.save(customer);
}
