// src/components/calendar/dialogs/AddEventDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  color: z.string(),
}).refine(data => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  defaultTime?: string;
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  onClose,
  event,
  defaultDate,
  defaultTime
}) => {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: format(defaultDate || new Date(), 'yyyy-MM-dd'),
      startTime: defaultTime || '09:00',
      endTime: defaultTime ? addHour(defaultTime) : '10:00',
      color: 'blue'
    }
  });

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color
      });
    } else if (defaultDate) {
      setValue('date', format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [event, defaultDate, reset, setValue]);

  const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
      const eventData = {
        ...data,
        updatedAt: new Date().toISOString()
      };

      if (event) {
        // Update existing event
        await updateDoc(doc(db, 'calendarEvents', event.id), eventData);
      } else {
        // Create new event
        await addDoc(collection(db, 'calendarEvents'), {
          ...eventData,
          createdAt: new Date().toISOString()
        });
      }

      reset();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedColor = watch('color');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Enter event title"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                className={errors.startTime ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_COLORS.map((color) => (
                <motion.button
                  key={color.value}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setValue('color', color.value)}
                  className={`
                    h-10 rounded-md border-2 transition-all
                    ${selectedColor === color.value 
                      ? 'border-gray-900 dark:border-gray-100 shadow-lg' 
                      : 'border-transparent'
                    }
                  `}
                  style={{ backgroundColor: color.color }}
                >
                  <span className="sr-only">{color.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add description..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : event ? 'Update' : 'Add'} Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function addHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newHours = (hours + 1) % 24;
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}