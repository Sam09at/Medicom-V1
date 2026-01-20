import { Appointment, AppointmentStatus, AppointmentType, Patient, User } from './types';

export const CURRENT_USER_DOCTOR: User = {
  id: 'u1',
  name: 'Dr. Amina',
  role: 'DOCTOR',
  avatar: 'https://picsum.photos/id/64/100/100',
  clinicName: 'Cabinet Dentaire Amina'
};

export const CURRENT_USER_ADMIN: User = {
  id: 'u99',
  name: 'Sami (CEO)',
  role: 'SUPER_ADMIN',
  avatar: 'https://picsum.photos/id/1005/100/100',
};

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', firstName: 'Karim', lastName: 'Benali', phone: '+212 600-112233', age: 42, gender: 'M', insuranceType: 'CNOPS', lastVisit: '2024-01-10' },
  { id: 'p2', firstName: 'Fatima', lastName: 'Zahra', phone: '+212 600-445566', age: 29, gender: 'F', insuranceType: 'CNSS', lastVisit: '2024-01-15' },
  { id: 'p3', firstName: 'Youssef', lastName: 'Idrissi', phone: '+212 600-778899', age: 35, gender: 'M', insuranceType: 'Private', lastVisit: '2023-12-20' },
  { id: 'p4', firstName: 'Layla', lastName: 'Amrani', phone: '+212 600-001122', age: 55, gender: 'F', insuranceType: 'None', lastVisit: '2024-01-18' },
  { id: 'p5', firstName: 'Omar', lastName: 'Tazi', phone: '+212 661-998877', age: 60, gender: 'M', insuranceType: 'CNOPS' },
];

// Helper to create dates relative to today
const today = new Date();
const setTime = (hours: number, minutes: number, dayOffset: number = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patientId: 'p1',
    doctorId: 'u1',
    start: setTime(9, 0),
    duration: 30,
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.CONFIRMED,
    patientName: 'Karim Benali'
  },
  {
    id: 'a2',
    patientId: 'p2',
    doctorId: 'u1',
    start: setTime(10, 0),
    duration: 45,
    type: AppointmentType.TREATMENT,
    status: AppointmentStatus.PENDING,
    patientName: 'Fatima Zahra'
  },
  {
    id: 'a3',
    patientId: 'p3',
    doctorId: 'u1',
    start: setTime(11, 30),
    duration: 30,
    type: AppointmentType.CONTROL,
    status: AppointmentStatus.COMPLETED,
    patientName: 'Youssef Idrissi'
  },
  {
    id: 'a4',
    patientId: 'p4',
    doctorId: 'u1',
    start: setTime(14, 0),
    duration: 60,
    type: AppointmentType.TREATMENT,
    status: AppointmentStatus.CONFIRMED,
    patientName: 'Layla Amrani'
  },
  // Tomorrow
  {
    id: 'a5',
    patientId: 'p5',
    doctorId: 'u1',
    start: setTime(9, 0, 1),
    duration: 30,
    type: AppointmentType.CONSULTATION,
    status: AppointmentStatus.PENDING,
    patientName: 'Omar Tazi'
  }
];

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [AppointmentStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  [AppointmentStatus.RESCHEDULED]: 'bg-purple-100 text-purple-800 border-purple-200',
  [AppointmentStatus.NOSHOW]: 'bg-gray-200 text-gray-800 border-gray-300',
};