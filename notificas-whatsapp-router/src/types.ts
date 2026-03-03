/**
 * WhatsApp Router Multi-tenant - Tipos
 */

export interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  referralTokens?: string[];
}

export interface UserMembership {
  phone: string;
  tenantIds: string[];
  updatedAt: Date;
}

export interface WaSession {
  phone: string;
  conversationId?: string;
  activeTenantId: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface WaMessage {
  direction: 'in' | 'out';
  phone: string;
  tenantId?: string;
  payload: unknown;
  createdAt: Date;
  pricingCategory?: string;
}

export interface PendingChoiceOption {
  index: number;
  tenantId: string;
  label: string;
}

export interface WaPendingChoice {
  phone: string;
  options: PendingChoiceOption[];
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}

export interface WaLastTenant {
  phone: string;
  tenantId: string;
  updatedAt: Date;
}

export type ResolveAction =
  | { action: 'silent_unregistered' }
  | { action: 'silent_or_handoff' }
  | { action: 'ask_choice'; options: PendingChoiceOption[] }
  | { action: 'route'; tenantId: string };

export interface IncomingMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'contacts' | 'video' | 'image' | string;
  text?: { body: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  referral?: {
    type: string;
    source_url?: string;
  };
  context?: { from?: string };
}

export interface WebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product?: string;
        metadata?: { phone_number_id: string; display_phone_number: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: IncomingMessage[];
        statuses?: unknown[];
      };
      field: string;
    }>;
  }>;
}
