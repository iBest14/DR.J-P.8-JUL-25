// src/components/calendar/PaymentPromiseSync.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Check, AlertCircle, Info } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentPromiseSyncProps {
  clients: any[]; // Your client type
  onSyncComplete?: () => void;
}

export const PaymentPromiseSync: React.FC<PaymentPromiseSyncProps> = ({ 
  clients,
  onSyncComplete 
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'warning' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [syncStats, setSyncStats] = useState({
    total: 0,
    synced: 0,
    needsSync: 0
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkSyncStatus();
  }, [clients]);

  const checkSyncStatus = async () => {
    const promisesWithDates = clients.filter(c => c.paymentPromise?.date);
    const total = promisesWithDates.length;

    if (total === 0) {
      setSyncStats({ total: 0, synced: 0, needsSync: 0 });
      return;
    }

    // Check how many are already synced
    const eventQuery = query(
      collection(db, 'calendarEvents'),
      where('type', '==', 'paymentPromise')
    );
    
    const snapshot = await getDocs(eventQuery);
    const syncedClientIds = new Set(
      snapshot.docs.map(doc => doc.data().clientId)
    );
    
    const synced = promisesWithDates.filter(c => syncedClientIds.has(c.id)).length;
    const needsSync = total - synced;

    setSyncStats({ total, synced, needsSync });
  };

  const syncPaymentPromises = async () => {
    setSyncing(true);
    setSyncStatus({ type: null, message: '' });
    setProgress(0);
    
    try {
      const promisesToSync = clients.filter(client => client.paymentPromise?.date);
      const total = promisesToSync.length;
      
      if (total === 0) {
        setSyncStatus({
          type: 'warning',
          message: 'No payment promises to sync.'
        });
        setSyncing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Get existing synced events
      const eventQuery = query(
        collection(db, 'calendarEvents'),
        where('type', '==', 'paymentPromise')
      );
      const existingEvents = await getDocs(eventQuery);
      const existingClientIds = new Map();
      
      existingEvents.docs.forEach(doc => {
        existingClientIds.set(doc.data().clientId, doc.id);
      });

      for (let i = 0; i < promisesToSync.length; i++) {
        const client = promisesToSync[i];
        setProgress(((i + 1) / total) * 100);

        try {
          const eventData = {
            title: `Payment: ${client.firstName} ${client.lastName}`,
            date: client.paymentPromise.date,
            startTime: '09:00',
            endTime: '10:00',
            color: new Date(client.paymentPromise.date) < new Date() ? 'red' : 'green',
            description: `Payment promise of $${client.paymentPromise.amount.toLocaleString()}. ${client.paymentPromise.notes || ''}`,
            type: 'paymentPromise',
            clientId: client.id,
            amount: client.paymentPromise.amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (existingClientIds.has(client.id)) {
            // Update existing event
            const eventId = existingClientIds.get(client.id);
            await updateDoc(doc(db, 'calendarEvents', eventId), eventData);
          } else {
            // Create new event
            await addDoc(collection(db, 'calendarEvents'), eventData);
          }

          successCount++;
        } catch (err) {
          console.error(`Error syncing promise for ${client.firstName} ${client.lastName}:`, err);
          errorCount++;
        }
      }

      setSyncStatus({
        type: errorCount === 0 ? 'success' : 'warning',
        message: `Synced ${successCount} payment promises${errorCount > 0 ? ` with ${errorCount} errors` : ''}.`
      });
      
      await checkSyncStatus();
      onSyncComplete?.();
    } catch (err) {
      setSyncStatus({
        type: 'error',
        message: 'Failed to sync payment promises. Please try again.'
      });
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  const getSyncBadgeVariant = () => {
    if (syncStats.needsSync === 0) return 'default';
    if (syncStats.needsSync === syncStats.total) return 'destructive';
    return 'secondary';
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Payment Promise Sync
            </CardTitle>
            <CardDescription>
              Sync client payment promises to calendar events
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getSyncBadgeVariant()}>
              {syncStats.synced} / {syncStats.total} Synced
            </Badge>
            
            <Button
              size="sm"
              onClick={syncPaymentPromises}
              disabled={syncing || syncStats.total === 0}
            >
              {syncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress bar */}
        <AnimatePresence>
          {syncing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Syncing payment promises...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status message */}
        <AnimatePresence>
          {syncStatus.type && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant={syncStatus.type === 'error' ? 'destructive' : 'default'}>
                {syncStatus.type === 'success' && <Check className="h-4 w-4" />}
                {syncStatus.type === 'warning' && <AlertCircle className="h-4 w-4" />}
                {syncStatus.type === 'error' && <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{syncStatus.message}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info section */}
        {!syncing && !syncStatus.type && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5" />
            <div>
              {syncStats.total === 0 ? (
                <p>No payment promises to sync.</p>
              ) : syncStats.needsSync === 0 ? (
                <p>All payment promises are synced to the calendar.</p>
              ) : (
                <p>{syncStats.needsSync} payment promise{syncStats.needsSync !== 1 ? 's' : ''} need{syncStats.needsSync === 1 ? 's' : ''} syncing.</p>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Past Due</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Upcoming</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};