// app/page.tsx o components/CalendarExample.tsx
import React, { useState } from 'react';
import { FollowUpScheduler } from '@/components/FollowUps/FollowUpScheduler';
import { FollowUpNotes } from '@/components/FollowUps/FollowUpNotes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarIcon, MessageSquare } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  timestamp: Date;
  author: string;
}

export default function CalendarIntegration() {
  const [showScheduler, setShowScheduler] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      text: 'Cliente interesado en el producto X. Programar demo para la próxima semana.',
      timestamp: new Date(),
      author: 'Usuario Demo'
    }
  ]);

  const handleSchedule = (data: {
    date: Date;
    time: string;
    color: string;
    notes?: string;
  }) => {
    console.log('Seguimiento programado:', data);
    // Aquí iría la lógica para guardar en Firebase
    setShowScheduler(false);
    // Mostrar mensaje de éxito
    alert(`Seguimiento programado para ${data.date.toLocaleDateString()} a las ${data.time}`);
  };

  const handleAddNote = (text: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      author: 'Usuario Demo'
    };
    setNotes([...notes, newNote]);
  };

  const handleEditNote = (noteId: string, newText: string) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, text: newText } : note
    ));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  if (showScheduler) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <FollowUpScheduler
            onSchedule={handleSchedule}
            onCancel={() => setShowScheduler(false)}
          />
        </div>
      </div>
    );
  }

  if (showNotes) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowNotes(false)}
            >
              ← Volver
            </Button>
          </div>
          <FollowUpNotes
            followUpId="demo-123"
            clientName="Cliente Demo"
            date={new Date()}
            notes={notes}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            currentUser="Usuario Demo"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sistema de Seguimiento de Clientes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <CalendarIcon className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold">Programar Seguimiento</h2>
              <p className="text-muted-foreground">
                Agenda un recordatorio para contactar a tu cliente
              </p>
              <Button onClick={() => setShowScheduler(true)}>
                Programar Ahora
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <MessageSquare className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-semibold">Ver Notas</h2>
              <p className="text-muted-foreground">
                Revisa y agrega notas sobre tus seguimientos
              </p>
              <Button onClick={() => setShowNotes(true)}>
                Ver Notas ({notes.length})
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Estado del Sistema:</h3>
          <ul className="space-y-1 text-sm">
            <li>✅ Componentes ShadCN UI configurados</li>
            <li>✅ Sistema de programación de seguimientos</li>
            <li>✅ Sistema de notas con edición y eliminación</li>
            <li>✅ Integración con tipos TypeScript</li>
            <li>⏳ Integración con Firebase (pendiente)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}