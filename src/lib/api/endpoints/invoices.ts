/**
 * Invoices API Endpoints (REST)
 */

import apiClient from '../client';

const FUNCTION_NAME = 'api-invoices';

export interface InvoicePackage {
  id: string;
  name: Record<string, string> | string;
}

export interface Invoice {
  id: string;
  user_id: string;
  family_id: string | null;
  package_id: string | null;
  invoice_number: string | null;
  amount: number;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  payment_gateway: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  stripe_payment_intent_id: string | null;
  billing_agreement_id: string | null;
  is_recurring: boolean | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  packages?: InvoicePackage;
}

export const invoicesApi = {
  /**
   * List all invoices for the current user
   */
  list: async (): Promise<Invoice[]> => {
    return apiClient.get<Invoice[]>(FUNCTION_NAME);
  },

  /**
   * Get a specific invoice by ID
   */
  get: async (id: string): Promise<Invoice> => {
    return apiClient.get<Invoice>(FUNCTION_NAME, { id });
  },

  /**
   * Get invoices filtered by payment status
   */
  listByStatus: async (status: string): Promise<Invoice[]> => {
    return apiClient.get<Invoice[]>(FUNCTION_NAME, { status });
  },

  /**
   * Get the latest paid invoice
   */
  getLatestPaid: async (): Promise<Invoice | null> => {
    return apiClient.get<Invoice | null>(FUNCTION_NAME, { latest: 'true' });
  },
};

export default invoicesApi;
