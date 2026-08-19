/**
 * Notification Service module for Finance by Pooja
 * Handles system local notifications in Capacitor Android APK and Web Browser
 */

export async function requestNotificationPermission() {
  try {
    // 1. Capacitor Native Android check
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      const perm = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        return { success: true, message: 'Android Local Notifications permission GRANTED!' };
      } else {
        return { success: false, message: 'Notification permission denied on device.' };
      }
    }

    // 2. Standard Web Browser check
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return { success: true, message: 'Web Notifications permission GRANTED!' };
      } else {
        return { success: false, message: 'Notification permission denied or dismissed.' };
      }
    }

    // Fallback: If WebView without standard Notification object
    return { 
      success: true, 
      message: 'In-App Ledger Alerts active for this session.' 
    };
  } catch (err) {
    console.error('Error requesting notification permissions:', err);
    return { success: false, message: 'Permission request error: ' + err.message };
  }
}

export async function triggerNotificationSignal(title, body) {
  try {
    // 1. Capacitor Native Android Local Notification
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
      await window.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 500) },
            sound: null,
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
      return true;
    }

    // 2. Standard Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'icon.png'
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to dispatch system notification:', err);
  }
  return false;
}

export async function checkAndNotifyDuePayments(enrichedLoans = [], currentDateStr) {
  // Check if alerted today already
  const lastNotify = localStorage.getItem('lastNotificationDate');
  if (lastNotify === currentDateStr) return;

  let dueCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;
  let totalDueAmt = 0;

  // Calculate upcoming target window (next 3 days)
  const d = new Date(currentDateStr);
  d.setDate(d.getDate() + 3);
  const next3DaysStr = d.toISOString().split('T')[0];

  enrichedLoans.forEach(l => {
    if (l.remainingAmount > 0) {
      if (l.dueDate === currentDateStr) {
        dueCount++;
        totalDueAmt += l.remainingAmount;
      } else if (l.dueDate < currentDateStr) {
        overdueCount++;
      } else if (l.dueDate > currentDateStr && l.dueDate <= next3DaysStr) {
        upcomingCount++;
      }
    }
  });

  if (dueCount > 0 || overdueCount > 0 || upcomingCount > 0) {
    let msgParts = [];
    if (dueCount > 0) {
      msgParts.push(`${dueCount} due today (₹${totalDueAmt.toLocaleString('en-IN')})`);
    }
    if (overdueCount > 0) {
      msgParts.push(`${overdueCount} overdue`);
    }
    if (upcomingCount > 0) {
      msgParts.push(`${upcomingCount} upcoming in 3 days`);
    }

    const title = "Finance by Pooja - Payment Reminders";
    const body = msgParts.join(" • ");

    const sent = await triggerNotificationSignal(title, body);
    if (sent) {
      localStorage.setItem('lastNotificationDate', currentDateStr);
    }
  }
}
