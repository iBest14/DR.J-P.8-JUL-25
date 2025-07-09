import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EVENT_COLORS } from '@/types/calendar';

interface FollowUpSchedulerProps {
  onSchedule: (data: {
    date: Date;
    time: string;
    color: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
  initialDate?: Date;
}

export const FollowUpScheduler: React.FC<FollowUpSchedulerProps> = ({
  onSchedule,
  onCancel,
  initialDate = new Date()
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedColor, setSelectedColor] = useState<string>(EVENT_COLORS[0].value);
  const [notes, setNotes] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const handleSubmit = () => {
    if (selectedDate) {
      onSchedule({
        date: selectedDate,
        time: selectedTime,
        color: selectedColor,
        notes
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Programar Seguimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fecha */}
        <div className="space-y-2">
          <Label>Fecha del seguimiento</Label>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Seleccionar fecha"}
          </Button>
          {showCalendar && (
            <div className="rounded-md border mt-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setShowCalendar(false);
                }}
                initialFocus
                locale={es}
              />
            </div>
          )}
        </div>

        {/* Hora */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hora del seguimiento
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Categoría / Prioridad</Label>
          <RadioGroup value={selectedColor} onValueChange={(value: string) => setSelectedColor(value)}>
            <div className="grid grid-cols-2 gap-3">
              {EVENT_COLORS.map((color) => (
                <div key={color.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={color.value} id={color.value} />
                  <Label 
                    htmlFor={color.value} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div 
                      className={cn(
                        "w-4 h-4 rounded-full",
                        color.className
                      )} 
                    />
                    {color.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Agregar notas sobre el seguimiento..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Resumen */}
        {selectedDate && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Resumen del seguimiento:</p>
                <p className="text-muted-foreground">
                  {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} a las {selectedTime}
                </p>
                {notes && (
                  <p className="text-muted-foreground mt-1">Notas: {notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedDate}
          >
            Programar Seguimiento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};