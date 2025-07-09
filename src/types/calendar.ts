// types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'payment' | 'followup' | 'appointment' | 'other';
  clientId: string;
  clientName: string;
  amount?: number;
  notes?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  color?: string;
}

export interface EventColorConfig {
  value: string;
  label: string;
  className: string; // Cambiado de 'class' a 'className'
}

export const EVENT_COLORS: EventColorConfig[] = [
  { value: 'blue', label: 'Normal', className: 'bg-blue-500' },
  { value: 'green', label: 'Completado', className: 'bg-green-500' },
  { value: 'yellow', label: 'Importante', className: 'bg-yellow-500' },
  { value: 'red', label: 'Urgente', className: 'bg-red-500' },
  { value: 'purple', label: 'Reunión', className: 'bg-purple-500' },
  { value: 'pink', label: 'Personal', className: 'bg-pink-500' },
  { value: 'orange', label: 'Pendiente', className: 'bg-orange-500' },
  { value: 'gray', label: 'Cancelado', className: 'bg-gray-500' }
];

export interface CalendarFilters {
  showPayments: boolean;
  showFollowUps: boolean;
  showAppointments: boolean;
  clientId?: string;
}