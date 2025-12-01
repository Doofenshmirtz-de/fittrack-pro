# 🔔 Notification Features für FitTrack Pro

## Überblick

FitTrack Pro bietet jetzt erweiterte Notification Features für ein optimales Training-Tracking Erlebnis, besonders beim Training mit dem Handy!

## Features

### 1. 📱 **Persistent Training Notification**

Während ein Training aktiv ist, wird eine dauerhafte Benachrichtigung angezeigt, die:

- ✅ Auf dem **Lock Screen** sichtbar ist
- ✅ Im **Notification Center** bleibt
- ✅ **Live-Updates** alle 10 Sekunden erhält
- ✅ Folgende Informationen zeigt:
  - ⏱️ Aktuelle Trainingsdauer (z.B. "23min")
  - 💪 Aktuell laufende Übung (z.B. "Bankdrücken")
  - 📊 Fortschritt (z.B. "5/8 Übungen")

**Beispiel:**
```
🏋️ Brust & Trizeps
⏱️ 45min
💪 Bankdrücken
📊 3/6 Übungen
```

### 2. 🔒 **Wake Lock - Bildschirm bleibt wach**

Während des Trainings bleibt der Bildschirm automatisch wach:

- ✅ Kein nerviges Entsperren zwischen Sätzen
- ✅ Display bleibt an, bis Training beendet wird
- ✅ Automatische Freigabe nach Training

**Browser-Unterstützung:**
- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 16.4+)
- ⚠️ Firefox (experimentell)

### 3. 🏷️ **App Badge - Training-Dauer auf Icon**

Das App-Icon zeigt die aktuelle Trainingsdauer als Badge:

- ✅ Rote Zahl auf dem App-Icon
- ✅ Zeigt Trainingsdauer in Minuten
- ✅ Update alle 10 Sekunden
- ✅ Wird automatisch gelöscht nach Training

**Beispiel:**
```
[📱 FitTrack Icon]  (45)  ← Trainingsdauer: 45 Minuten
```

## Technische Details

### Permissions

Beim ersten Start eines Trainings wird nach folgenden Permissions gefragt:

1. **Notification Permission** - für Lock Screen Notifications
2. **Wake Lock** - für aktiven Bildschirm (optional, kein Prompt)

### Implementierung

#### Notification Updates

```typescript
// Live-Updates alle 10 Sekunden
startWorkoutNotificationUpdates(getNotificationData, 10000);
```

Die Notification zeigt immer die aktuellsten Daten:
- Timer wird live aktualisiert
- Aktuelle Übung wird erkannt
- Fortschritt wird berechnet

#### Wake Lock

```typescript
// Bildschirm wach halten
await requestWakeLock();

// Nach Training freigeben
await releaseWakeLock();
```

#### Badge API

```typescript
// Badge setzen (Minuten)
await setAppBadge(totalMinutes);

// Badge löschen
await clearAppBadge();
```

### Cleanup

Alle Features werden automatisch aufgeräumt wenn:
- ✅ Training beendet wird
- ✅ Benutzer die Seite verlässt
- ✅ App geschlossen wird

## Browser-Kompatibilität

| Feature | Chrome/Edge | Safari | Firefox |
|---------|-------------|--------|---------|
| Persistent Notifications | ✅ | ✅ | ✅ |
| Service Worker Notifications | ✅ | ✅ | ✅ |
| Wake Lock API | ✅ | ✅ (16.4+) | ⚠️ |
| Badge API | ✅ | ⚠️ | ❌ |
| Lock Screen Integration | ✅ | ✅ | ✅ |

**Legende:**
- ✅ Vollständig unterstützt
- ⚠️ Teilweise unterstützt / experimentell
- ❌ Nicht unterstützt

## PWA Installation

Für die beste Erfahrung sollte FitTrack Pro als PWA installiert werden:

### iOS (Safari)
1. Öffne FitTrack Pro in Safari
2. Tippe auf das "Teilen" Symbol
3. Wähle "Zum Home-Bildschirm"
4. Tippe auf "Hinzufügen"

### Android (Chrome)
1. Öffne FitTrack Pro in Chrome
2. Tippe auf die drei Punkte (⋮)
3. Wähle "App installieren" oder "Zum Startbildschirm hinzufügen"
4. Tippe auf "Installieren"

### Desktop (Chrome/Edge)
1. Öffne FitTrack Pro im Browser
2. Klicke auf das "+" Icon in der Adressleiste
3. Klicke auf "Installieren"

## Vorteile

### Für Training im Gym:

- 📱 **Keine Bildschirm-Timeouts** - Wake Lock hält Display wach
- 🔔 **Lock Screen Integration** - Timer auch bei gesperrtem Handy sichtbar
- ⚡ **Schneller Zugriff** - Notification Click öffnet direkt das Training
- 🏷️ **Auf einen Blick** - Badge zeigt Trainingsdauer

### Für Motivation:

- 📊 **Fortschritt sichtbar** - Siehst immer wie viele Übungen noch fehlen
- ⏱️ **Zeit im Blick** - Live-Timer motiviert zum Weitermachen
- 💪 **Aktuelle Übung** - Keine Verwirrung zwischen Sätzen

### Für User Experience:

- 🎯 **Native App Gefühl** - Funktioniert wie eine echte Fitness-App
- 🔋 **Batterieschonend** - Updates nur alle 10 Sekunden
- 🧹 **Automatisches Cleanup** - Keine "vergessenen" Notifications

## Datenschutz

Alle Notification Daten:
- ✅ Bleiben **lokal** auf deinem Gerät
- ✅ Werden **nicht** an Server gesendet
- ✅ Werden **nicht** gespeichert oder getrackt
- ✅ Verschwinden nach Training automatisch

## Support

Bei Problemen oder Fragen zu den Notification Features:
1. Stelle sicher, dass **Notification Permissions** erlaubt sind
2. Prüfe ob dein Browser die Features unterstützt
3. Installiere die App als **PWA** für beste Erfahrung
4. Teste in einem **unterstützten Browser** (Chrome/Safari)

---

**Viel Erfolg beim Training! 💪🏋️**

