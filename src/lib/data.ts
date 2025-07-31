import type { Patient, Study, User, Backup } from './types';

export const users: User[] = [
  { id: 'user1', name: 'Dr. Alan Grant', role: 'operator', status: 'active', subscriptionStatus: 'paid' },
  { id: 'user2', name: 'Dr. Ellie Sattler', role: 'solicitante', status: 'active', subscriptionStatus: 'paid' },
  { id: 'user3', name: 'Dr. Ian Malcolm', role: 'solicitante', status: 'active', subscriptionStatus: 'paid' },
  { id: 'user4', name: 'Dr. John Hammond', role: 'operator', status: 'suspended', subscriptionStatus: 'overdue'},
  { id: 'user5', name: 'Dennis Nedry', role: 'admin', status: 'active', subscriptionStatus: 'paid'}
];

export const patients: Patient[] = [
  { id: 'patient1', name: 'John Doe', dni: '12345678A', dob: '1980-05-15', operatorId: 'user1', requesterId: 'user2', status: 'active' },
  { id: 'patient2', name: 'Jane Smith', dni: '87654321B', dob: '1992-11-20', operatorId: 'user1', requesterId: 'user3', status: 'active' },
  { id: 'patient3', name: 'Peter Jones', dni: '56781234C', dob: '1975-02-10', operatorId: 'user1', requesterId: 'user2', status: 'archived' },
  { id: 'patient4', name: 'Mary Williams', dni: '43218765D', dob: '2001-08-30', operatorId: 'user4', requesterId: 'user3', status: 'active' },
];

export const studies: Study[] = [
  {
    id: 'study1',
    patientId: 'patient1',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-20T10:00:00Z',
    isUrgent: true,
    description: 'Ecocardiograma para evaluar la función ventricular izquierda.',
    diagnosis: 'Insuficiencia mitral leve.',
    comments: [
      { id: 'c1', userId: 'user1', userName: 'Dr. Alan Grant', role: 'operator', text: 'Dr. Sattler, he subido el ecocardiograma del paciente. La fracción de eyección es del 55%. Quedo atento a sus comentarios.', timestamp: '2024-05-20T10:05:00Z' },
      { id: 'c2', userId: 'user2', userName: 'Dr. Ellie Sattler', role: 'solicitante', text: 'Gracias, Dr. Grant. Lo reviso y le doy una devolución. ¿Podría verificar la presión arterial registrada durante el estudio?', timestamp: '2024-05-20T11:30:00Z' },
    ]
  },
  {
    id: 'study2',
    patientId: 'patient2',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-19T14:30:00Z',
    isUrgent: false,
    description: 'Prueba de esfuerzo por dolor torácico reciente.',
    diagnosis: 'Sin signos de isquemia.',
    comments: []
  },
  {
    id: 'study3',
    patientId: 'patient1',
    videoUrl: '',
    reportUrl: '',
    date: '2023-11-10T09:00:00Z',
    isUrgent: false,
    description: 'Ecocardiograma de seguimiento.',
    diagnosis: 'Condición estable.',
    comments: []
  },
    {
    id: 'study4',
    patientId: 'patient3',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-18T11:00:00Z',
    isUrgent: false,
    description: 'Control cardiológico de rutina.',
    diagnosis: 'Función cardíaca normal.',
    comments: []
  },
  {
    id: 'study5',
    patientId: 'patient4',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-17T16:00:00Z',
    isUrgent: true,
    description: 'Evaluación cardíaca preoperatoria.',
    diagnosis: 'Estenosis aórtica identificada.',
    comments: [
      { id: 'c3', userId: 'user4', userName: 'Dr. John Hammond', role: 'operator', text: 'Estudio urgente para evaluación pre-quirúrgica. Se observa estenosis aórtica severa.', timestamp: '2024-05-17T16:10:00Z' },
    ]
  },
];

export const backups: Backup[] = [
  { id: 'backup1', date: '2024-05-22T03:00:00Z', firestoreSize: '1.2 GB', fileCount: 125, destinationUrl: 'gs://heartlink-backups/2024-05-22.gz', status: 'completed' },
  { id: 'backup2', date: '2024-05-21T03:00:00Z', firestoreSize: '1.1 GB', fileCount: 110, destinationUrl: 'gs://heartlink-backups/2024-05-21.gz', status: 'completed' },
  { id: 'backup3', date: '2024-05-20T03:00:00Z', firestoreSize: '1.0 GB', fileCount: 95, destinationUrl: 'gs://heartlink-backups/2024-05-20.gz', status: 'failed' },
  { id: 'backup4', date: '2024-05-23T03:00:00Z', firestoreSize: 'N/A', fileCount: 0, destinationUrl: '', status: 'in-progress' },
];
