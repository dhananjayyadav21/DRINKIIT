import { MongoCollection } from './mongoCollection';
import { Customer } from '@/types/customer';

const customers = new MongoCollection<Customer>('customers');

export function findByWaId(waId: string): Promise<Customer | null> {
  return customers.findOne({ waId });
}

export function findById(id: string): Promise<Customer | null> {
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
