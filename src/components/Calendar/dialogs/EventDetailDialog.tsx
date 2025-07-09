// src/components/calendar/dialogs/EventDetailDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarIcon, Clock, User, MapPin, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent, EVENT_COLORS } from '@/types/calendar';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

interface EventDetailDialogProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
}

export const EventDetailDialog: React.FC<EventDetailDialogProps> = ({
  open,
  onClose,
  event,
  onEdit
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!event) return null;

  const eventColor = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
  const eventDate = new Date(event.date);

  const formatEventDate = () => {
    const dayOfWeek = format(eventDate, 'EEEE');
    const date = format(eventDate, 'dd MMMM');
    const time = `at ${event.startTime}`;
    return `${dayOfWeek} ${date} ${time}`;
  };

  const formatEventEndDate = () => {
    // Assuming single-day events for now
    const endDate = format(eventDate, 'EEEE dd MMMM');
    const endTime = `at ${event.endTime}`;
    return `${endDate} ${endTime}`;
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'calendarEvents', event.id));
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] p-0">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 pb-0">
            <DialogTitle className="text-xl font-semibold">
              {event.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-4 pb-4 space-y-4">
            {/* Responsible */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Responsible</p>
                <p className="text-sm text-gray-600">{event.responsible || 'Alice Johnson'}</p>
              </div>
            </div>

            {/* Start Date */}
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-gray-600">{formatEventDate()}</p>
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-gray-600">{formatEventEndDate()}</p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              </div>
            )}

            {/* Color indicator */}
            <div className="flex items-center gap-2 pt-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: eventColor.color }}
              />
              <span className="text-sm text-gray-600">{eventColor.label} event</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 p-4 pt-0">
            <Button
              variant="outline"
              onClick={() => {
                onEdit(event);
                onClose();
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};