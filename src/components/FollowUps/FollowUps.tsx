import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Phone, MessageSquare, AlertCircle, TrendingUp, User, CalendarIcon } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isThisWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Importar con named exports
import { FollowUpScheduler } from './FollowUpScheduler';
import { FollowUpNotes } from './FollowUpNotes';
import { CalendarView } from '../Calendar/CalendarView';

// Tipos
interface Payment {
  id: string;
  date: Date;
  amount: number;
  status: 'pending' | 'completed' | 'overdue';
}

interface CommunicationLog {
  id: string;
  date: Date;
  type: 'call' | 'message' | 'email' | 'visit';
  notes: string;
  outcome?: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  installmentAmount: number;
  firstInstallmentDate: Date;
  payments: Payment[];
  communicationLog?: CommunicationLog[];
  communicationLogs?: CommunicationLog[]; // Por compatibilidad
  nextFollowUp?: Date;
  followUpNotes?: string;
}

interface FollowUpStats {
  today: number;
  tomorrow: number;
  thisWeek: number;
  overdue: number;
}

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

export const FollowUps: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [stats, setStats] = useState<FollowUpStats>({
    today: 0,
    tomorrow: 0,
    thisWeek: 0,
    overdue: 0
  });

  // Cargar clientes con seguimientos
  useEffect(() => {
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('nextFollowUp', '!=', null));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];

      // Calcular estadísticas
      const newStats: FollowUpStats = {
        today: 0,
        tomorrow: 0,
        thisWeek: 0,
        overdue: 0
      };

      clientsData.forEach(client => {
        if (client.nextFollowUp) {
          const followUpDate = new Date(client.nextFollowUp);
          if (isPast(followUpDate) && !isToday(followUpDate)) {
            newStats.overdue++;
          } else if (isToday(followUpDate)) {
            newStats.today++;
          } else if (isTomorrow(followUpDate)) {
            newStats.tomorrow++;
          } else if (isThisWeek(followUpDate)) {
            newStats.thisWeek++;
          }
        }
      });

      // Convertir clientes a eventos de calendario
      const events: CalendarEvent[] = clientsData
        .filter(client => client.nextFollowUp)
        .map(client => ({
          id: client.id,
          date: new Date(client.nextFollowUp!),
          time: '09:00', // Valor por defecto, deberías guardarlo en Firebase
          clientName: `${client.firstName} ${client.lastName}`,
          clientId: client.id,
          type: 'followup' as const,
          color: 'blue', // Valor por defecto, deberías guardarlo en Firebase
          notes: client.followUpNotes
        }));

      setCalendarEvents(events);
      setStats(newStats);
      setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);

  // Actualizar fecha de seguimiento
  const updateFollowUpDate = async (clientId: string, newDate: Date) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        nextFollowUp: newDate,
        followUpNotes: ''
      });
    } catch (error) {
      console.error('Error actualizando seguimiento:', error);
    }
  };

  // Obtener clientes por categoría
  const getClientsByCategory = (category: string): Client[] => {
    return clients.filter(client => {
      if (!client.nextFollowUp) return false;
      const followUpDate = new Date(client.nextFollowUp);
      
      switch (category) {
        case 'today':
          return isToday(followUpDate);
        case 'tomorrow':
          return isTomorrow(followUpDate);
        case 'week':
          return isThisWeek(followUpDate) && !isToday(followUpDate) && !isTomorrow(followUpDate);
        case 'overdue':
          return isPast(followUpDate) && !isToday(followUpDate);
        default:
          return false;
      }
    });
  };

  // Calcular progreso de pagos
  const calculatePaymentProgress = (client: Client): number => {
    const completedPayments = client.payments?.filter(p => p.status === 'completed').length || 0;
    const totalPayments = client.payments?.length || 0;
    return totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
  };

  // Obtener última comunicación
  const getLastCommunication = (client: Client): CommunicationLog | null => {
    const logs = client.communicationLog || client.communicationLogs || [];
    if (logs.length === 0) return null;
    
    return logs.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  };

  const renderClientTable = (clientsList: Client[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Próximo Seguimiento</TableHead>
            <TableHead>Progreso Pagos</TableHead>
            <TableHead>Última Comunicación</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay seguimientos en esta categoría
              </TableCell>
            </TableRow>
          ) : (
            clientsList.map(client => {
              const lastComm = getLastCommunication(client);
              const progress = calculatePaymentProgress(client);
              
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.firstName} {client.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {client.nextFollowUp && format(new Date(client.nextFollowUp), 'PPp', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lastComm ? (
                      <div className="flex items-center gap-2">
                        {lastComm.type === 'call' && <Phone className="h-4 w-4" />}
                        {lastComm.type === 'message' && <MessageSquare className="h-4 w-4" />}
                        <span className="text-sm">
                          {format(new Date(lastComm.date), 'dd/MM', { locale: es })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin comunicación</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowScheduler(true);
                        }}
                      >
                        Reprogramar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(client);
                          setShowNotes(true);
                        }}
                      >
                        Notas
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Seguimientos pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mañana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tomorrow}</div>
            <p className="text-xs text-muted-foreground">Próximos seguimientos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Total en la semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con listas de seguimientos */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">
            Hoy <Badge variant="secondary" className="ml-2">{stats.today}</Badge>
          </TabsTrigger>
          <TabsTrigger value="tomorrow">
            Mañana <Badge variant="secondary" className="ml-2">{stats.tomorrow}</Badge>
          </TabsTrigger>
          <TabsTrigger value="week">
            Esta Semana <Badge variant="secondary" className="ml-2">{stats.thisWeek}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Vencidos <Badge variant="destructive" className="ml-2">{stats.overdue}</Badge>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimientos para Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {renderClientTable(getClientsByCategory('today'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tomorrow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimientos para Mañana</CardTitle>
            </CardHeader>
            <CardContent>
              {renderClientTable(getClientsByCategory('tomorrow'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimientos de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
              {renderClientTable(getClientsByCategory('week'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Seguimientos Vencidos</CardTitle>
            </CardHeader>
            <CardContent>
              {renderClientTable(getClientsByCategory('overdue'))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView
            events={calendarEvents}
            onDateSelect={(date) => {
              console.log('Fecha seleccionada:', date);
            }}
            onEventClick={(event) => {
              const client = clients.find(c => c.id === event.clientId);
              if (client) {
                setSelectedClient(client);
                setShowNotes(true);
              }
            }}
            onAddEvent={(date) => {
              // Aquí podrías abrir el scheduler con la fecha preseleccionada
              console.log('Agregar evento para:', date);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {showScheduler && selectedClient && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
            <FollowUpScheduler
              onSchedule={(data) => {
                updateFollowUpDate(selectedClient.id, data.date);
                setShowScheduler(false);
                setSelectedClient(null);
              }}
              onCancel={() => {
                setShowScheduler(false);
                setSelectedClient(null);
              }}
              initialDate={selectedClient.nextFollowUp ? new Date(selectedClient.nextFollowUp) : new Date()}
            />
          </div>
        </div>
      )}

      {showNotes && selectedClient && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
            <FollowUpNotes
              followUpId={selectedClient.id}
              clientName={`${selectedClient.firstName} ${selectedClient.lastName}`}
              date={selectedClient.nextFollowUp ? new Date(selectedClient.nextFollowUp) : new Date()}
              notes={[]} // Aquí deberías cargar las notas reales
              onAddNote={(text) => {
                console.log('Nueva nota:', text);
                // Implementar guardado en Firebase
              }}
              onEditNote={(noteId, newText) => {
                console.log('Editar nota:', noteId, newText);
                // Implementar edición en Firebase
              }}
              onDeleteNote={(noteId) => {
                console.log('Eliminar nota:', noteId);
                // Implementar eliminación en Firebase
              }}
              currentUser="Usuario Actual"
            />
          </div>
        </div>
      )}
    </div>
  );
};