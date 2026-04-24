import { api } from './api';

export interface UsageStatus {
  is_pro: boolean;
  pro_expires_at: string | null;
  tool_uses: { used: number | null; limit: number | null; remaining: number | null };
  learn_uses: { used: number | null; limit: number | null; remaining: number | null };
}

export const getSubscriptionStatus = async (): Promise<UsageStatus> => {
  const { data } = await api.get('/subscription/status');
  return data;
};

export const createOrder = async () => {
  const { data } = await api.post('/subscription/create-order');
  return data;
};

export const verifyPayment = async (payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) => {
  const { data } = await api.post('/subscription/verify-payment', payload);
  return data;
};
