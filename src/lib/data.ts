import type { Patient, Study, User } from './types';

export const users: User[] = [
  { id: 'user1', name: 'Dr. Alan Grant', role: 'operator' },
  { id: 'user2', name: 'Dr. Ellie Sattler', role: 'requester' },
  { id: 'user3', name: 'Dr. Ian Malcolm', role: 'requester' },
];

export const patients: Patient[] = [
  { id: 'patient1', name: 'John Doe', dni: '12345678A', dob: '1980-05-15', operatorId: 'user1', requesterId: 'user2' },
  { id: 'patient2', name: 'Jane Smith', dni: '87654321B', dob: '1992-11-20', operatorId: 'user1', requesterId: 'user3' },
  { id: 'patient3', name: 'Peter Jones', dni: '56781234C', dob: '1975-02-10', operatorId: 'user1', requesterId: 'user2' },
  { id: 'patient4', name: 'Mary Williams', dni: '43218765D', dob: '2001-08-30', operatorId: 'user1', requesterId: 'user3' },
];

export const studies: Study[] = [
  {
    id: 'study1',
    patientId: 'patient1',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-20T10:00:00Z',
    isUrgent: true,
    description: 'Echocardiogram to assess left ventricular function.',
    diagnosis: 'Mild mitral regurgitation.',
  },
  {
    id: 'study2',
    patientId: 'patient2',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-19T14:30:00Z',
    isUrgent: false,
    description: 'Stress test due to recent chest pain.',
    diagnosis: 'No signs of ischemia.',
  },
  {
    id: 'study3',
    patientId: 'patient1',
    videoUrl: '',
    reportUrl: '',
    date: '2023-11-10T09:00:00Z',
    isUrgent: false,
    description: 'Follow-up echocardiogram.',
    diagnosis: 'Stable condition.',
  },
    {
    id: 'study4',
    patientId: 'patient3',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-18T11:00:00Z',
    isUrgent: false,
    description: 'Routine cardiac check-up.',
    diagnosis: 'Normal cardiac function.',
  },
  {
    id: 'study5',
    patientId: 'patient4',
    videoUrl: '',
    reportUrl: '',
    date: '2024-05-17T16:00:00Z',
    isUrgent: true,
    description: 'Pre-operative cardiac assessment.',
    diagnosis: 'Aortic stenosis identified.',
  },
];
