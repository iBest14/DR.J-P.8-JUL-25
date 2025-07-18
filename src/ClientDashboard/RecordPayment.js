/*import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import db from '../firebase';

function RecordPayment({ client, setClient }) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentDate) return;

    const newPayment = {
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      recordedAt: new Date().toISOString()
    };

    const updatedPayments = [...(client.payments || []), newPayment];

    const updates = {
      payments: updatedPayments
    };

    // ✅ Check if this payment fulfills a paymentPromise
    if (client.paymentPromise) {
      const promisedDate = new Date(client.paymentPromise.date);
      const actualDate = new Date(paymentDate);
      const promisedAmount = parseFloat(client.paymentPromise.amount);

      if (actualDate <= promisedDate && newPayment.amount >= promisedAmount) {
        updates.paymentPromise = null; // Auto-clear the promise
      }
    }

    const clientRef = doc(db, 'clients', client.id);
    await updateDoc(clientRef, updates);

    setClient(prev => ({
      ...prev,
      payments: updatedPayments,
      ...(updates.paymentPromise === null ? { paymentPromise: null } : {})
    }));

    setPaymentAmount('');
    setPaymentDate('');
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>💳 Record Payment</h3>
      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
      />
      <input
        type="number"
        placeholder="Amount Paid"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
      />
      <button
        onClick={handleRecordPayment}
        style={{
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Record Payment
      </button>

      {(client.payments || []).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Payment History</h4>
          <ul style={{ paddingLeft: '1rem' }}>
            {client.payments.map((p, index) => (
              <li key={index}>
                ${p.amount.toLocaleString()} on {new Date(p.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RecordPayment;
*/

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import db from '../firebase';

function RecordPayment({ client, setClient }) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentDate) return;

    const newPayment = {
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      recordedAt: new Date().toISOString()
    };

    const updatedPayments = [...(client.payments || []), newPayment];

    const updates = {
      payments: updatedPayments
    };

    // ✅ Check if this payment fulfills a paymentPromise
    if (client.paymentPromise) {
      const promisedDate = new Date(client.paymentPromise.date);
      const actualDate = new Date(paymentDate);
      const promisedAmount = parseFloat(client.paymentPromise.amount);

      if (actualDate <= promisedDate && newPayment.amount >= promisedAmount) {
        updates.paymentPromise = null; // Auto-clear the promise
      }
    }

    const clientRef = doc(db, 'clients', client.id);
    await updateDoc(clientRef, updates);

    setClient(prev => ({
      ...prev,
      payments: updatedPayments,
      ...(updates.paymentPromise === null ? { paymentPromise: null } : {})
    }));

    setPaymentAmount('');
    setPaymentDate('');
  };

  const handleDeletePayment = async (indexToDelete) => {
    const updatedPayments = client.payments.filter((_, index) => index !== indexToDelete);
    
    const clientRef = doc(db, 'clients', client.id);
    await updateDoc(clientRef, {
      payments: updatedPayments
    });

    setClient(prev => ({
      ...prev,
      payments: updatedPayments
    }));

    setShowConfirmDelete(null);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>💳 Record Payment</h3>
      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
      />
      <input
        type="number"
        placeholder="Amount Paid"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
      />
      <button
        onClick={handleRecordPayment}
        style={{
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Record Payment
      </button>

      {(client.payments || []).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Payment History</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {client.payments.map((p, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px' }}>
                    ${p.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {showConfirmDelete === index ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDeletePayment(index)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowConfirmDelete(null)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowConfirmDelete(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecordPayment;