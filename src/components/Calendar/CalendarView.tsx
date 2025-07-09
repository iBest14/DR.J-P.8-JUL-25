// components/Calendar/CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarIcon, 
  Clock, 
  User, 
  Phone,
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EVENT_COLORS } from '@/types/calendar';

interface CalendarEvent {
  id: string;
  date: Date;
  time: string;
  clientName: string;
  clientId: string;
  type: 'followup' | 'payment' | 'appointment';
  color: string;
  notes?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onDateSelect,
  onEventClick,
  onAddEvent
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    ).sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  };

  // Obtener color de fondo para el badge
  const getColorClass = (colorValue: string): string => {
    const color = EVENT_COLORS.find(c => c.value === colorValue);
    return color?.className || 'bg-gray-500';
  };

  // Obtener tipo de evento en español
  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      followup: 'Seguimiento',
      payment: 'Pago',
      appointment: 'Cita'
    };
    return labels[type] || type;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendario */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendario de Seguimientos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={es}
              className="rounded-md border"
              components={{
                Day: ({ date, ...props }) => {
                  const dayEvents = getEventsForDate(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const today = isToday(date);
                  
                  return (
                    <div className="relative">
                      <button
                        {...props}
                        className={cn(
                          "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          today && "border border-primary",
                          props.className
                        )}
                      >
                        {format(date, 'd')}
                      </button>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                getColorClass(event.color)
                              )}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              }}
            />
          </div>

          {/* Vista previa de eventos del mes */}
          <div className="mt-6">
            <h3 className="font-medium mb-3">Resumen del mes</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Total eventos</span>
                <Badge>{events.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Seguimientos</span>
                <Badge variant="secondary">
                  {events.filter(e => e.type === 'followup').length}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de eventos del día seleccionado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddEvent?.(selectedDate)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Evento
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No hay eventos para este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          getColorClass(event.color)
                        )} />
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.type)}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.clientName}
                      </p>
                      {event.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};