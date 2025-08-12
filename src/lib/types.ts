export interface Study {
  id: string;
  patientId: string;
  videoUrl?: string;
  videoPath?: string;
  reportUrl?: string;
  date: string;
  isUrgent: boolean;
  description: string;
  diagnosis?: string;
  comments?: string[];
  transcription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  dni?: string;
  dob?: string;
  phone?: string;
  email?: string;
  status?: string;
  requesterId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'operator' | 'solicitante' | 'medico_solicitante';
  specialty?: string;
  status?: 'active' | 'inactive';
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  planType: 'monthly';
  amount: number; // En pesos argentinos
  currency: 'ARS';
  
  // MercadoPago data
  mercadoPagoSubscriptionId?: string;
  mercadoPagoCustomerId?: string;
  
  // Fechas importantes
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  lastPaymentDate?: string;
  
  // Control de acceso
  gracePeriodEndDate?: string; // 10 días después del vencimiento
  isAccessBlocked: boolean;
  
  // Historial
  paymentHistory: PaymentRecord[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  mercadoPagoPaymentId: string;
  amount: number;
  currency: 'ARS';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  paymentDate: string;
  dueDate: string;
  paymentMethod?: string;
  description: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MercadoPagoWebhookEvent {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'subscription';
  date_created: string;
  application_id: number;
  user_id: string;
  version: number;
  api_version: string;
  action: 'payment.created' | 'payment.updated' | 'subscription.created' | 'subscription.updated';
  data: {
    id: string;
  };
}

export interface Backup {
  id: string;
  date: string;
  firestoreSize: string;
  fileCount: number;
  destinationUrl: string;
  status: 'completed' | 'in-progress' | 'failed';
}
