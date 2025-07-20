export interface Patient {
  id: string;
  name: string;
  dni: string;
  dob: string;
  operatorId: string;
  requesterId: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  role: 'operator' | 'requester';
  text: string;
  timestamp: string;
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
  comments: Comment[];
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

export interface Backup {
  id: string;
  date: string;
  firestoreSize: string;
  fileCount: number;
  destinationUrl: string;
  status: 'completed' | 'in-progress' | 'failed';
}
