export type CustomerState =
  | 'NEW'
  | 'CATALOG_SENT'
  | 'AWAITING_VERIFICATION'
  | 'AWAITING_PAYMENT_CHOICE'
  | 'AWAITING_PAYMENT';

export interface Customer {
  id: string;
  createdAt: string;
  updatedAt: string;
  waId: string;
  name: string | null;
  state: CustomerState;
  currentOrder: string | null;
}
