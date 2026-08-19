const Dexie = window.Dexie;

if (!Dexie) {
  console.error("Dexie is not loaded! Make sure the script tag in index.html is correct.");
}

export const db = new Dexie('UdhaarManagerDB');

// Define database tables and index fields
db.version(1).stores({
  persons: '++id, name, mobile, createdAt',
  loans: '++id, personId, principalAmount, interestRate, interestType, givenDate, dueDate, status, createdAt',
  payments: '++id, loanId, amount, paymentDate, paymentMethod, createdAt'
});

// Helper: Save a new person along with their initial loan in a transaction
export async function addPersonWithLoan(person, loan) {
  return await db.transaction('rw', [db.persons, db.loans], async () => {
    const personId = await db.persons.add({
      name: person.name.trim(),
      mobile: person.mobile.trim(),
      address: (person.address || '').trim(),
      notes: (person.notes || '').trim(),
      createdAt: new Date().toISOString()
    });

    const loanId = await db.loans.add({
      personId: personId,
      principalAmount: parseFloat(loan.principalAmount),
      interestRate: parseFloat(loan.interestRate),
      interestType: loan.interestType, // 'flat' | 'monthly' | 'yearly'
      givenDate: loan.givenDate, // YYYY-MM-DD
      dueDate: loan.dueDate, // YYYY-MM-DD
      notes: (loan.notes || '').trim(),
      status: 'active', // 'active' | 'partially_paid' | 'paid' | 'overdue'
      createdAt: new Date().toISOString()
    });

    return { personId, loanId };
  });
}

// Helper: Add a new loan for an existing person
export async function addLoan(loan) {
  return await db.loans.add({
    personId: parseInt(loan.personId),
    principalAmount: parseFloat(loan.principalAmount),
    interestRate: parseFloat(loan.interestRate),
    interestType: loan.interestType,
    givenDate: loan.givenDate,
    dueDate: loan.dueDate,
    notes: (loan.notes || '').trim(),
    status: 'active',
    createdAt: new Date().toISOString()
  });
}

// Helper: Record a payment for a loan
export async function addPayment(payment) {
  return await db.transaction('rw', [db.payments, db.loans], async () => {
    const paymentId = await db.payments.add({
      loanId: parseInt(payment.loanId),
      amount: parseFloat(payment.amount),
      paymentDate: payment.paymentDate, // YYYY-MM-DD
      paymentMethod: payment.paymentMethod, // 'cash' | 'upi' | 'bank_transfer' | 'other'
      notes: (payment.notes || '').trim(),
      createdAt: new Date().toISOString()
    });

    // We let the caller update the status of the loan, or we can handle it.
    // Let's compute remaining amount and update loan status outside or here.
    return paymentId;
  });
}

// Helper: Delete a payment
export async function deletePayment(paymentId) {
  return await db.payments.delete(parseInt(paymentId));
}

// Helper: Delete a loan and all its associated payments
export async function deleteLoan(loanId) {
  return await db.transaction('rw', [db.loans, db.payments], async () => {
    await db.payments.where({ loanId: parseInt(loanId) }).delete();
    await db.loans.delete(parseInt(loanId));
  });
}

// Helper: Delete a person, all their loans, and all associated payments
export async function deletePerson(personId) {
  const pId = parseInt(personId);
  return await db.transaction('rw', [db.persons, db.loans, db.payments], async () => {
    const loans = await db.loans.where({ personId: pId }).toArray();
    for (const loan of loans) {
      await db.payments.where({ loanId: loan.id }).delete();
    }
    await db.loans.where({ personId: pId }).delete();
    await db.persons.delete(pId);
  });
}

// Helper: Get a person, their loans, and all payments
export async function getPersonDetails(personId) {
  const pId = parseInt(personId);
  const person = await db.persons.get(pId);
  if (!person) return null;

  const loans = await db.loans.where({ personId: pId }).toArray();
  const enrichedLoans = await Promise.all(loans.map(async (loan) => {
    const payments = await db.payments.where({ loanId: loan.id }).toArray();
    return { ...loan, payments };
  }));

  return {
    ...person,
    loans: enrichedLoans
  };
}

// Helper: Get all loans with their corresponding person details and payments
export async function getAllLoansWithDetails() {
  const loans = await db.loans.toArray();
  const persons = await db.persons.toArray();
  const personMap = new Map(persons.map(p => [p.id, p]));

  const enrichedLoans = await Promise.all(loans.map(async (loan) => {
    const payments = await db.payments.where({ loanId: loan.id }).toArray();
    return {
      ...loan,
      person: personMap.get(loan.personId) || { name: 'Unknown', mobile: '' },
      payments
    };
  }));

  return enrichedLoans;
}

// Helper: Update a loan's status directly
export async function updateLoanStatus(loanId, status) {
  return await db.loans.update(parseInt(loanId), { status });
}

// Helper: Export all data to JSON
export async function exportAllData() {
  const persons = await db.persons.toArray();
  const loans = await db.loans.toArray();
  const payments = await db.payments.toArray();
  return JSON.stringify({ persons, loans, payments }, null, 2);
}

// Helper: Import all data from JSON (restores and overwrites)
export async function importAllData(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.persons || !data.loans || !data.payments) {
    throw new Error("Invalid backup file structure");
  }

  return await db.transaction('rw', [db.persons, db.loans, db.payments], async () => {
    await db.persons.clear();
    await db.loans.clear();
    await db.payments.clear();

    if (data.persons.length > 0) await db.persons.bulkAdd(data.persons);
    if (data.loans.length > 0) await db.loans.bulkAdd(data.loans);
    if (data.payments.length > 0) await db.payments.bulkAdd(data.payments);
  });
}
