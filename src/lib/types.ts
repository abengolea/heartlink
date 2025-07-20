export interface Patient {
  id: string;
  name: string;
  dni: string;
  dob: string;
  operatorId: string;
  requesterId: string;
}

export interface Study {
  id: string;
  patientId: string;
  videoUrl: string;
  reportUrl: string;
  date: string;
  isUrgent: boolean;
  description: string;
  diagnosis: string;
  sharedLink?: {
    url: string;
    pin: string;
    expires: string;
  };
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator' | 'requester';
  status: 'active' | 'suspended';
  subscriptionStatus: 'paid' | 'pending' | 'overdue';
}