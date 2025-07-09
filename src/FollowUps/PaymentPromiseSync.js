// src/FollowUps/PaymentPromiseSync.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Sync as SyncIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import db from "../firebase";

const PaymentPromiseSync = ({ clients }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Check sync status on mount
  useEffect(() => {
    checkSyncStatus();
  }, [clients]);

  const checkSyncStatus = async () => {
    const promisesWithDates = clients.filter(c => c.paymentPromise?.date);
    setTotalCount(promisesWithDates.length);

    // Check how many are already synced
    const eventQuery = query(
      collection(db, "calendarEvents"),
      where("type", "==", "paymentPromise")
    );
    
    const snapshot = await getDocs(eventQuery);
    const syncedClientIds = snapshot.docs.map(doc => doc.data().clientId);
    const syncedPromises = promisesWithDates.filter(c => syncedClientIds.includes(c.id));
    setSyncedCount(syncedPromises.length);
  };

  const syncPaymentPromises = async () => {
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      const promisesToSync = clients.filter(client => client.paymentPromise?.date);
      let successCount = 0;
      let errorCount = 0;

      // Get existing synced events
      const eventQuery = query(
        collection(db, "calendarEvents"),
        where("type", "==", "paymentPromise")
      );
      const existingEvents = await getDocs(eventQuery);
      const existingClientIds = new Map();
      
      existingEvents.docs.forEach(doc => {
        existingClientIds.set(doc.data().clientId, doc.id);
      });

      for (const client of promisesToSync) {
        try {
          const eventData = {
            title: `Payment: ${client.firstName} ${client.lastName}`,
            date: client.paymentPromise.date,
            startTime: "09:00",
            endTime: "10:00",
            color: new Date(client.paymentPromise.date) < new Date() ? "red" : "green",
            description: `Payment promise of $${client.paymentPromise.amount.toLocaleString()}. ${client.paymentPromise.notes || ''}`,
            type: "paymentPromise",
            clientId: client.id,
            amount: client.paymentPromise.amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (existingClientIds.has(client.id)) {
            // Update existing event
            const eventId = existingClientIds.get(client.id);
            await updateDoc(doc(db, "calendarEvents", eventId), eventData);
          } else {
            // Create new event
            await addDoc(collection(db, "calendarEvents"), eventData);
          }

          successCount++;
        } catch (err) {
          console.error(`Error syncing promise for ${client.firstName} ${client.lastName}:`, err);
          errorCount++;
        }
      }

      setSyncStatus({
        type: errorCount === 0 ? "success" : "warning",
        message: `Synced ${successCount} payment promises${errorCount > 0 ? ` with ${errorCount} errors` : ""}.`,
      });
      
      setSyncedCount(successCount);
      checkSyncStatus();
    } catch (err) {
      setSyncStatus({
        type: "error",
        message: "Failed to sync payment promises. Please try again.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getSyncStatusIcon = () => {
    if (syncedCount === 0) return <ErrorIcon color="error" />;
    if (syncedCount < totalCount) return <InfoIcon color="warning" />;
    return <CheckIcon color="success" />;
  };

  const getSyncStatusColor = () => {
    if (syncedCount === 0) return "error";
    if (syncedCount < totalCount) return "warning";
    return "success";
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: "background.default" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getSyncStatusIcon()}
          <Typography variant="h6">Payment Promise Sync</Typography>
        </Box>
        
        <Tooltip title="Sync payment promises to calendar">
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={syncPaymentPromises}
            disabled={syncing || totalCount === 0}
            size="small"
          >
            Sync Now
          </Button>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Chip
          label={`${syncedCount} / ${totalCount} Synced`}
          color={getSyncStatusColor()}
          size="small"
        />
        <Typography variant="body2" color="text.secondary">
          {totalCount === 0
            ? "No payment promises to sync"
            : syncedCount === totalCount
            ? "All payment promises are synced"
            : `${totalCount - syncedCount} payment promises need syncing`}
        </Typography>
      </Box>

      {syncing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Syncing payment promises to calendar...
          </Typography>
        </Box>
      )}

      {syncStatus && (
        <Alert 
          severity={syncStatus.type} 
          sx={{ mt: 2 }}
          onClose={() => setSyncStatus(null)}
        >
          {syncStatus.message}
        </Alert>
      )}

      <Box sx={{ mt: 2, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> Payment promises are automatically color-coded:
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: "#ef4444", borderRadius: "50%" }} />
            <Typography variant="caption">Past Due</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: "#10b981", borderRadius: "50%" }} />
            <Typography variant="caption">Upcoming</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default PaymentPromiseSync;