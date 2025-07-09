/*import React from 'react';

export default function BillingOverview({ client }) {
  const invoiceTotal = parseFloat(client?.invoiceTotal || 0);
  const monthlyInstallment = client.installmentAmount || 500;

  const rawStart = client.firstInstallmentDate;
  if (!rawStart) return <p>Missing first installment date.</p>;

  // Parse firstInstallmentDate
  let firstInstallmentDate;
  if (rawStart?.seconds) {
    firstInstallmentDate = new Date(rawStart.seconds * 1000);
  } else {
    firstInstallmentDate = new Date(rawStart);
  }

  const today = new Date();

  // Payments made after the first installment date
  const validPayments = (client?.payments || []).filter(p => {
    const paymentDate = new Date(p.date);
    return paymentDate >= firstInstallmentDate;
  });

  const validTotalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = invoiceTotal - validTotalPaid;

  // Format last payment
  const getLastPaymentDisplay = () => {
    if (!validPayments.length) return 'N/A';
    const latest = validPayments.reduce((latest, p) => {
      return new Date(p.date) > new Date(latest.date) ? p : latest;
    });
    const dateStr = new Date(latest.date).toLocaleDateString('default', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    return `${dateStr} – $${latest.amount.toLocaleString()}`;
  };

  // Calculate missed months
  const calculateMissedMonths = () => {
    const dueMonths = [];
    const missedRange = { start: null, end: null };

    const monthsSinceStart = Math.floor(
      (today.getFullYear() - firstInstallmentDate.getFullYear()) * 12 +
      (today.getMonth() - firstInstallmentDate.getMonth()) + 1
    );

    const paidInstallments = Math.floor(validTotalPaid / monthlyInstallment);
    const unpaidInstallments = Math.max(0, monthsSinceStart - paidInstallments);

    for (let i = paidInstallments; i < paidInstallments + unpaidInstallments; i++) {
      const dueDate = new Date(firstInstallmentDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      if (dueDate <= today) {
        const label = `${dueDate.toLocaleString('default', { month: 'long' })} ${dueDate.getFullYear()}`;
        dueMonths.push(label);
        if (!missedRange.start) missedRange.start = label;
        missedRange.end = label;
      }
    }

    return {
      dueMonths,
      missedLabel: missedRange.start ? `${missedRange.start} – ${missedRange.end}` : 'None'
    };
  };

  // Calculate future expected due months
  const calculateExpectedMonths = () => {
    const months = [];
    for (let i = 0; i < Math.ceil(remainingBalance / monthlyInstallment); i++) {
      const nextDate = new Date(firstInstallmentDate);
      nextDate.setMonth(nextDate.getMonth() + validPayments.length + i);
      months.push(`${nextDate.toLocaleString('default', { month: 'long' })} ${nextDate.getFullYear()}`);
    }
    return months;
  };

  const { dueMonths, missedLabel } = calculateMissedMonths();
  const expectedMonths = calculateExpectedMonths();
  const formatMoney = (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  const paymentsLeft = Math.ceil(remainingBalance / monthlyInstallment);
  const amountDue = dueMonths.length * monthlyInstallment;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Client Info</h3>
      <p><strong>Name:</strong> {client.firstName} {client.lastName}</p>
      <p><strong>Case Type:</strong> {client.caseType}</p>
      <p><strong>Case Status:</strong> {client.caseStatus}</p>
      <p><strong>Invoice Total:</strong> {formatMoney(invoiceTotal)}</p>
      <p><strong>Total Paid (After Installment Start):</strong> {formatMoney(validTotalPaid)}</p>
      <p><strong>Remaining Balance:</strong> {formatMoney(remainingBalance)}</p>
      <p><strong>Payments Left:</strong> {paymentsLeft}</p>
      <p><strong>Amount Due:</strong> {formatMoney(amountDue)}</p>
      <p><strong>Months Past Due:</strong> {dueMonths.length > 0 ? dueMonths.length : 'None'}</p>
      <p><strong>Missed Months:</strong> {missedLabel}</p>
      <p><strong>Expected Due Months:</strong> {expectedMonths.length > 0 ? expectedMonths.join(', ') : 'None'}</p>
      <p><strong>Last Payment Date:</strong> {getLastPaymentDisplay()}</p>
    </div>
  );
}
*/

import React from 'react';

export default function BillingOverview({ client }) {
  const invoiceTotal = parseFloat(client?.invoiceTotal || 0);
  const monthlyInstallment = client.installmentAmount || 500;

  const rawStart = client.firstInstallmentDate;
  if (!rawStart) return <p>Missing first installment date.</p>;

  // Parse firstInstallmentDate
  let firstInstallmentDate;
  if (rawStart?.seconds) {
    firstInstallmentDate = new Date(rawStart.seconds * 1000);
  } else {
    firstInstallmentDate = new Date(rawStart);
  }

  const today = new Date();

  // Get all payments
  const allPayments = client?.payments || [];
  
  // Calculate total paid (including initial payment)
  const totalPaidOverall = allPayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate remaining balance from invoice total
  const remainingBalance = invoiceTotal - totalPaidOverall;

  // For installment calculations, we need to consider what's left after initial payment
  // Find initial payment (should be on or before first installment date)
  const initialPayment = allPayments.find(p => 
    p.isInitialPayment || new Date(p.date) < firstInstallmentDate
  );
  
  const initialPaymentAmount = initialPayment ? initialPayment.amount : 0;
  
  // Amount that should be paid in installments
  const installmentBase = invoiceTotal - initialPaymentAmount;
  
  // Payments made after initial payment (installment payments)
  const installmentPayments = allPayments.filter(p => {
    const paymentDate = new Date(p.date);
    return paymentDate >= firstInstallmentDate && !p.isInitialPayment;
  });
  
  const installmentsPaid = installmentPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate how many months have passed since first installment
  const monthsSinceStart = Math.max(0, 
    Math.floor(
      (today.getFullYear() - firstInstallmentDate.getFullYear()) * 12 +
      (today.getMonth() - firstInstallmentDate.getMonth()) + 1
    )
  );

  // Calculate expected installments and missed payments
  const expectedInstallmentTotal = monthsSinceStart * monthlyInstallment;
  const installmentsDue = Math.max(0, expectedInstallmentTotal - installmentsPaid);
  const monthsMissed = Math.floor(installmentsDue / monthlyInstallment);

  // Format last payment
  const getLastPaymentDisplay = () => {
    if (!allPayments.length) return 'N/A';
    const latest = allPayments.reduce((latest, p) => {
      return new Date(p.date) > new Date(latest.date) ? p : latest;
    });
    const dateStr = new Date(latest.date).toLocaleDateString('default', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const paymentType = latest.isInitialPayment ? ' (Initial Payment)' : '';
    return `${dateStr} – $${latest.amount.toLocaleString()}${paymentType}`;
  };

  // Calculate missed months details
  const calculateMissedMonths = () => {
    const dueMonths = [];
    const missedRange = { start: null, end: null };

    const paidInstallmentMonths = Math.floor(installmentsPaid / monthlyInstallment);
    
    for (let i = paidInstallmentMonths; i < monthsSinceStart; i++) {
      const dueDate = new Date(firstInstallmentDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const label = `${dueDate.toLocaleString('default', { month: 'long' })} ${dueDate.getFullYear()}`;
      dueMonths.push(label);
      
      if (!missedRange.start) missedRange.start = label;
      missedRange.end = label;
    }

    return {
      dueMonths,
      missedLabel: missedRange.start ? `${missedRange.start} – ${missedRange.end}` : 'None'
    };
  };

  // Calculate future expected due months
  const calculateExpectedMonths = () => {
    const months = [];
    const remainingInstallments = Math.ceil(remainingBalance / monthlyInstallment);
    
    for (let i = 0; i < remainingInstallments; i++) {
      const nextDate = new Date(firstInstallmentDate);
      const monthsToAdd = monthsSinceStart - monthsMissed + i;
      nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
      months.push(`${nextDate.toLocaleString('default', { month: 'long' })} ${nextDate.getFullYear()}`);
    }
    return months;
  };

  const { dueMonths, missedLabel } = calculateMissedMonths();
  const expectedMonths = calculateExpectedMonths();
  const formatMoney = (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  const paymentsLeft = Math.ceil(remainingBalance / monthlyInstallment);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>Client Info</h3>
      <p><strong>Name:</strong> {client.firstName} {client.lastName}</p>
      <p><strong>Case Type:</strong> {client.caseType}</p>
      <p><strong>Case Status:</strong> {client.caseStatus}</p>
      
      <h4>Financial Summary</h4>
      <p><strong>Invoice Total:</strong> {formatMoney(invoiceTotal)}</p>
      <p><strong>Initial Payment:</strong> {formatMoney(initialPaymentAmount)}</p>
      <p><strong>Total Paid (All Payments):</strong> {formatMoney(totalPaidOverall)}</p>
      <p><strong>Remaining Balance:</strong> {formatMoney(remainingBalance)}</p>
      
      <h4>Installment Details</h4>
      <p><strong>Monthly Installment:</strong> {formatMoney(monthlyInstallment)}</p>
      <p><strong>Installment Payments Made:</strong> {formatMoney(installmentsPaid)}</p>
      <p><strong>Installments Due:</strong> {formatMoney(installmentsDue)}</p>
      <p><strong>Payments Left:</strong> {paymentsLeft}</p>
      <p><strong>Months Past Due:</strong> {monthsMissed > 0 ? monthsMissed : 'None'}</p>
      <p><strong>Missed Months:</strong> {missedLabel}</p>
      <p><strong>Expected Due Months:</strong> {expectedMonths.length > 0 ? expectedMonths.slice(0, 5).join(', ') : 'None'}</p>
      <p><strong>Last Payment:</strong> {getLastPaymentDisplay()}</p>
    </div>
  );
}