/**
 * Notification Management für FitTrack Pro
 * Verwaltet Persistent Notifications während aktiver Trainings
 */

let notificationUpdateInterval: NodeJS.Timeout | null = null;
let currentNotificationTag = 'active-workout';

// Service Worker Notification Click Handler registrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      // Navigiere zur aktiven Workout Seite
      window.location.href = event.data.url || '/';
    }
  });
}

export interface WorkoutNotificationData {
  workoutName: string;
  duration: string;
  currentExercise?: string;
  completedExercises: number;
  totalExercises: number;
}

/**
 * Fragt nach Notification Permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Notifications werden von diesem Browser nicht unterstützt');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Erstellt oder aktualisiert die Training Notification
 */
export const showWorkoutNotification = async (data: WorkoutNotificationData): Promise<void> => {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    return;
  }

  const { workoutName, duration, currentExercise, completedExercises, totalExercises } = data;

  // Body Text zusammenstellen
  let body = `⏱️ ${duration}`;
  
  if (currentExercise) {
    body += `\n💪 ${currentExercise}`;
  }
  
  if (totalExercises > 0) {
    body += `\n📊 ${completedExercises}/${totalExercises} Übungen`;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: currentNotificationTag,
    requireInteraction: true, // Bleibt sichtbar bis User interagiert
    silent: true, // Kein Sound bei Updates
    data: {
      url: window.location.href,
      workoutId: data
    }
  };

  // Service Worker Notification (für bessere Lock Screen Integration)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(`🏋️ ${workoutName}`, options);
    } catch (error) {
      // Fallback zu normaler Notification
      new Notification(`🏋️ ${workoutName}`, options);
    }
  } else {
    // Normale Notification
    new Notification(`🏋️ ${workoutName}`, options);
  }
};

/**
 * Startet Live-Updates für die Training Notification
 */
export const startWorkoutNotificationUpdates = (
  getNotificationData: () => WorkoutNotificationData,
  intervalMs: number = 10000 // Alle 10 Sekunden aktualisieren
): void => {
  // Stoppe vorherige Updates falls vorhanden
  stopWorkoutNotificationUpdates();

  // Erste Notification sofort anzeigen
  showWorkoutNotification(getNotificationData());

  // Periodische Updates
  notificationUpdateInterval = setInterval(() => {
    showWorkoutNotification(getNotificationData());
  }, intervalMs);
};

/**
 * Stoppt die Notification Updates
 */
export const stopWorkoutNotificationUpdates = (): void => {
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval);
    notificationUpdateInterval = null;
  }
};

/**
 * Schließt alle aktiven Workout Notifications
 */
export const closeWorkoutNotification = async (): Promise<void> => {
  stopWorkoutNotificationUpdates();

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: currentNotificationTag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.warn('Fehler beim Schließen der Notification:', error);
    }
  }
};

/**
 * Wake Lock API - Hält Bildschirm wach während Training
 */
let wakeLock: WakeLockSentinel | null = null;

export const requestWakeLock = async (): Promise<boolean> => {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API wird nicht unterstützt');
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    
    // Event Listener für wenn Wake Lock freigegeben wird
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock wurde freigegeben');
    });

    console.log('Wake Lock aktiv - Bildschirm bleibt wach');
    return true;
  } catch (error) {
    console.warn('Fehler beim Aktivieren des Wake Locks:', error);
    return false;
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock deaktiviert');
    } catch (error) {
      console.warn('Fehler beim Freigeben des Wake Locks:', error);
    }
  }
};

/**
 * Badge API - Zeigt Training-Dauer auf App Icon
 */
export const setAppBadge = async (count: number): Promise<void> => {
  if (!('setAppBadge' in navigator)) {
    return;
  }

  try {
    await (navigator as any).setAppBadge(count);
  } catch (error) {
    console.warn('Fehler beim Setzen des App Badge:', error);
  }
};

export const clearAppBadge = async (): Promise<void> => {
  if (!('clearAppBadge' in navigator)) {
    return;
  }

  try {
    await (navigator as any).clearAppBadge();
  } catch (error) {
    console.warn('Fehler beim Löschen des App Badge:', error);
  }
};

