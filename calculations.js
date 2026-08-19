// Helper to parse date strings and calculate exact difference in days
export function getDaysDifference(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  // Zero out time part to get accurate calendar days difference
  d1.setHours(0,0,0,0);
  d2.setHours(0,0,0,0);
  
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Interest calculation logic
export function calculateInterest(principal, rate, interestType, givenDate, dueDate) {
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  
  if (p === 0 || r === 0) {
    return {
      interestAmount: 0,
      totalAmount: p,
      durationDays: 0,
      durationText: '0 days'
    };
  }

  const days = getDaysDifference(givenDate, dueDate);
  let interestAmount = 0;
  let durationText = '';

  switch (interestType) {
    case 'monthly': {
      const months = days / 30;
      interestAmount = p * (r / 100) * months;
      durationText = `${months.toFixed(1)} months (${days} days)`;
      break;
    }
    case 'yearly': {
      const years = days / 365;
      interestAmount = p * (r / 100) * years;
      durationText = `${years.toFixed(2)} years (${days} days)`;
      break;
    }
    case 'flat':
    default: {
      // Flat is a fixed one-time percentage of the principal
      interestAmount = p * (r / 100);
      durationText = `Flat rate (${days} days)`;
      break;
    }
  }

  // Rounding interest to 2 decimal places
  interestAmount = Math.round(interestAmount * 100) / 100;
  const totalAmount = Math.round((p + interestAmount) * 100) / 100;

  return {
    interestAmount,
    totalAmount,
    durationDays: days,
    durationText
  };
}

// Get rich details and status for a loan
export function getLoanSummary(loan, payments = [], currentDateStr = new Date().toISOString().split('T')[0]) {
  const { interestAmount, totalAmount, durationDays, durationText } = calculateInterest(
    loan.principalAmount,
    loan.interestRate,
    loan.interestType,
    loan.givenDate,
    loan.dueDate
  );

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remainingAmount = Math.max(0, Math.round((totalAmount - totalPaid) * 100) / 100);
  
  let status = 'active';
  let overdueDays = 0;

  if (remainingAmount <= 0) {
    status = 'paid';
  } else {
    const isPastDue = currentDateStr > loan.dueDate;
    if (isPastDue) {
      status = 'overdue';
      overdueDays = getDaysDifference(loan.dueDate, currentDateStr);
    } else if (totalPaid > 0) {
      status = 'partially_paid';
    } else {
      status = 'active';
    }
  }

  return {
    ...loan,
    interestAmount,
    totalAmount,
    durationDays,
    durationText,
    totalPaid,
    remainingAmount,
    status,
    overdueDays
  };
}
