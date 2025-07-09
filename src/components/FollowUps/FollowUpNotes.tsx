import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  User,
  Clock,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  text: string;
  timestamp: Date;
  author: string;
}

interface FollowUpNotesProps {
  followUpId: string;
  clientName: string;
  date: Date;
  notes: Note[];
  onAddNote: (text: string) => void;
  onEditNote: (noteId: string, newText: string) => void;
  onDeleteNote: (noteId: string) => void;
  currentUser: string;
}

export const FollowUpNotes: React.FC<FollowUpNotesProps> = ({
  followUpId,
  clientName,
  date,
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  currentUser
}) => {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  const startEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const saveEdit = () => {
    if (editingNoteId && editingText.trim()) {
      onEditNote(editingNoteId, editingText.trim());
      setEditingNoteId(null);
      setEditingText('');
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notas de Seguimiento
            </CardTitle>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{clientName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(date, "PPP", { locale: es })}</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary">
            {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Lista de notas */}
        <ScrollArea className="h-[400px] pr-4">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay notas para este seguimiento</p>
              <p className="text-sm mt-2">Agrega la primera nota a continuación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <React.Fragment key={note.id}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {editingNoteId === note.id ? (
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[80px]"
                            autoFocus
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{note.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(note.timestamp, "d MMM, HH:mm", { locale: es })}</span>
                          </div>
                        </div>
                      </div>
                      {note.author === currentUser && (
                        <div className="flex items-start gap-1">
                          {editingNoteId === note.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={saveEdit}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEdit(note)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onDeleteNote(note.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < notes.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Formulario para nueva nota */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Separator />
          <div className="space-y-2">
            <Textarea
              placeholder="Escribe una nota sobre este seguimiento..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newNote.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Agregar Nota
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};