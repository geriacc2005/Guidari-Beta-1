
import { User, UserRole, Patient, Appointment } from './types';

export const mockUsers: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'crisfreuter@gmail.com',
    password: 'Cris1234',
    pin: '666967',
    firstName: 'Cristina',
    lastName: 'Fernandez Reuter',
    name: 'Cristina Fernandez Reuter',
    dob: '1980-05-15',
    role: UserRole.ADMIN,
    avatar: 'https://zugbripyvaidkpesrvaa.supabase.co/storage/v1/object/sign/Imagenes/avatar_CFR.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMmViNTc1OC0yY2UyLTRkODgtOGQ5MC1jZWFiYTM1MjY1Y2IiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJJbWFnZW5lcy9hdmF0YXJfQ0ZSLnBuZyIsImlhdCI6MTc2ODM0NzQ2MiwiZXhwIjoyNzE0NDI3NDYyfQ.o8bP3pWIpSkClIjhz5zErphPJuHii1330JinBh6zn4I',
    specialty: 'Fonoaudiología',
    sessionValue: 8000,
    commissionRate: 100
  }
];

export const mockPatients: Patient[] = [];

export const mockAppointments: Appointment[] = [];
