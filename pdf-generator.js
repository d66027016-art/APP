/**
 * PDF Generator module for Finance by Pooja
 * Generates Payment Receipts and Due/Upcoming Payment Statements using jsPDF
 */

export function generatePaymentReceiptPDF({ person, loan, payment, currencySymbol = '₹' }) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF generator library is loading. Please try again in a moment.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42];   // #0F172A Deep Navy
  const accentColor = [16, 185, 129];  // #10B981 Emerald
  const goldColor = [217, 119, 6];     // #D97706 Gold
  const textColor = [51, 65, 85];      // Slate 700

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 38, 'F');

  // Gold accent bar
  doc.setFillColor(...goldColor);
  doc.rect(0, 38, 210, 2, 'F');

  // Header Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FINANCE BY POOJA', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Personal Udhaar & Interest Management Ledger', 14, 25);
  doc.text('Contact / Inquiry: Admin Office', 14, 30);

  // Receipt Badge Right Top
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(145, 10, 51, 18, 2, 2, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', 148, 17);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: REC-${payment.id || Date.now()}`, 148, 23);

  // 2. Receipt Details Section
  let y = 48;

  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT INFORMATION', 14, y);
  y += 3;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 7;

  // Two columns: Borrower Details vs Payment Summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);

  // Col 1: Borrower Info
  doc.text('Borrower Details:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${person?.name || 'N/A'}`, 14, y + 5);
  doc.text(`Mobile: ${person?.mobile || 'N/A'}`, 14, y + 10);
  doc.text(`Address: ${person?.address || 'N/A'}`, 14, y + 15);

  // Col 2: Payment Details
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Received: ${payment.paymentDate}`, 110, y + 5);
  doc.text(`Payment Method: ${(payment.paymentMethod || 'cash').toUpperCase()}`, 110, y + 10);
  doc.text(`Notes: ${payment.notes || 'None'}`, 110, y + 15);

  y += 24;

  // 3. Highlighted Amount Box
  doc.setFillColor(240, 253, 244); // Light emerald green bg
  doc.setDrawColor(...accentColor);
  doc.roundedRect(14, y, 182, 20, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('AMOUNT RECEIVED:', 20, y + 12);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  const formattedAmount = `${currencySymbol} ${parseFloat(payment.amount).toLocaleString('en-IN')}`;
  doc.text(formattedAmount, 130, y + 13);

  y += 28;

  // 4. Loan Breakdown Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('LOAN STATUS BREAKDOWN', 14, y);
  y += 3;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 4;

  if (doc.autoTable) {
    doc.autoTable({
      startY: y,
      head: [['Loan ID', 'Given Principal', 'Interest Rate', 'Total Return', 'Total Paid', 'Remaining Due']],
      body: [
        [
          `#${loan?.id || 'N/A'}`,
          `${currencySymbol} ${parseFloat(loan?.principalAmount || 0).toLocaleString('en-IN')}`,
          `${loan?.interestRate}% (${loan?.interestType})`,
          `${currencySymbol} ${parseFloat(loan?.totalAmount || 0).toLocaleString('en-IN')}`,
          `${currencySymbol} ${parseFloat(loan?.totalPaid || 0).toLocaleString('en-IN')}`,
          `${currencySymbol} ${parseFloat(loan?.remainingAmount || 0).toLocaleString('en-IN')}`
        ]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 8.5
      },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 15;
  } else {
    y += 20;
  }

  // 5. Terms & Signature Block
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('• This is a computer-generated receipt issued by Finance by Pooja.', 14, y);
  doc.text('• Payments recorded are credited against accrued interest and principal outstanding.', 14, y + 4);

  // Authorized Signature line right side
  doc.setDrawColor(148, 163, 184);
  doc.line(140, y + 25, 190, y + 25);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Authorized Signature', 145, y + 30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Finance by Pooja', 150, y + 34);

  // Save / Trigger Download
  const filename = `Receipt_${person?.name ? person.name.replace(/\s+/g, '_') : 'Payment'}_REC-${payment.id || Date.now()}.pdf`;
  doc.save(filename);
}


export function generateDueStatementPDF({ loans = [], title = "DUE & OUTSTANDING PAYMENTS STATEMENT", currentDateStr, currencySymbol = '₹' }) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF generator library is loading. Please try again in a moment.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42];   // #0F172A Deep Navy
  const accentColor = [16, 185, 129];  // #10B981 Emerald
  const roseColor = [225, 29, 72];     // #E11D48 Rose
  const textColor = [51, 65, 85];      // Slate 700

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFillColor(...roseColor);
  doc.rect(0, 36, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FINANCE BY POOJA', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(title.toUpperCase(), 14, 23);
  doc.text(`Ledger Reference Date: ${currentDateStr}`, 14, 29);

  // Date Generated Top Right
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 145, 16);

  let y = 46;

  // 2. Summary Metrics Bar
  let totalDueAmt = 0;
  let totalPrincipal = 0;
  let overdueCount = 0;
  let dueTodayCount = 0;

  loans.forEach(l => {
    totalDueAmt += (l.remainingAmount || 0);
    totalPrincipal += (l.principalAmount || 0);
    if (l.dueDate === currentDateStr) dueTodayCount++;
    else if (l.dueDate < currentDateStr) overdueCount++;
  });

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL LOANS', 20, y + 7);
  doc.text('TOTAL OUTSTANDING DUE', 75, y + 7);
  doc.text('OVERDUE / DUE TODAY', 145, y + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`${loans.length} Records`, 20, y + 15);

  doc.setTextColor(...roseColor);
  doc.text(`${currencySymbol} ${totalDueAmt.toLocaleString('en-IN')}`, 75, y + 15);

  doc.setTextColor(...primaryColor);
  doc.text(`${overdueCount} Overdue / ${dueTodayCount} Today`, 145, y + 15);

  y += 30;

  // 3. Table of Loans
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('LOAN & PAYMENT SCHEDULE BREAKDOWN', 14, y);
  y += 3;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);
  y += 4;

  const tableRows = loans.map((l, index) => {
    let statusText = 'ACTIVE';
    if (l.remainingAmount <= 0) statusText = 'PAID';
    else if (l.dueDate === currentDateStr) statusText = 'DUE TODAY';
    else if (l.dueDate < currentDateStr) statusText = `OVERDUE (${l.overdueDays || 0}d)`;
    else statusText = 'UPCOMING';

    return [
      (index + 1).toString(),
      l.person?.name || 'N/A',
      l.person?.mobile || 'N/A',
      `${currencySymbol} ${parseFloat(l.principalAmount || 0).toLocaleString('en-IN')}`,
      l.dueDate || 'N/A',
      statusText,
      `${currencySymbol} ${parseFloat(l.remainingAmount || 0).toLocaleString('en-IN')}`
    ];
  });

  if (doc.autoTable) {
    doc.autoTable({
      startY: y,
      head: [['#', 'Borrower', 'Mobile', 'Principal', 'Due Date', 'Status', 'Balance Due']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 15;
  } else {
    y += 20;
  }

  // 4. Footer & Signature
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('• End of statement. Issued by Finance by Pooja Ledger System.', 14, y);

  doc.setDrawColor(148, 163, 184);
  doc.line(140, y + 20, 190, y + 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Authorized Signature', 145, y + 25);

  const filename = `Due_Payments_Statement_${currentDateStr}.pdf`;
  doc.save(filename);
}
