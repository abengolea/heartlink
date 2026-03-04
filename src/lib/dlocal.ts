/**
 * dLocal Go API - https://docs.dlocalgo.com
 * Auth: Bearer API_KEY:SECRET_KEY
 * Env: DLOCAL_API_KEY, DLOCAL_SECRET_KEY, DLOCAL_BASE_URL (opcional), DLOCAL_SANDBOX
 */

const DLOCAL_SANDBOX_URL = 'https://api-sbx.dlocalgo.com';
const DLOCAL_LIVE_URL = 'https://api.dlocalgo.com';

export function getDLocalBaseUrl(): string {
  if (process.env.DLOCAL_BASE_URL) {
    return process.env.DLOCAL_BASE_URL.replace(/\/$/, '');
  }
  return process.env.DLOCAL_SANDBOX === 'true' ? DLOCAL_SANDBOX_URL : DLOCAL_LIVE_URL;
}

export interface DLocalGoPaymentRequest {
  amount: number;
  currency: string;
  country: string;
  payment_method_flow: 'REDIRECT';
  payer: {
    name: string;
    email: string;
    document: string;
    user_reference?: string;
  };
  order_id: string;
  description?: string;
  notification_url?: string;
  callback_url?: string;
}

export interface DLocalGoPaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  status_detail?: string;
  redirect_url?: string;
  order_id: string;
  [key: string]: unknown;
}

export async function createDLocalGoPayment(
  payload: DLocalGoPaymentRequest
): Promise<DLocalGoPaymentResponse> {
  const apiKey = process.env.DLOCAL_API_KEY || process.env.DLOCAL_GO_API_KEY;
  const secretKey = process.env.DLOCAL_SECRET_KEY || process.env.DLOCAL_GO_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      'dLocal Go credentials missing. Define DLOCAL_API_KEY y DLOCAL_SECRET_KEY en .env.local'
    );
  }

  const baseUrl = getDLocalBaseUrl();
  const url = `${baseUrl}/v1/payments`;
  const bearerToken = `${apiKey}:${secretKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'HeartLink/1.0',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ [DLocal Go] API error:', data);
    throw new Error(
      data?.message || data?.error || `DLocal Go API error: ${response.status}`
    );
  }

  return data as DLocalGoPaymentResponse;
}
