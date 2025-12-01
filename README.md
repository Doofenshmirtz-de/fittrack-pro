# FitTrack Pro

Eine moderne Fitness-Tracking Progressive Web App (PWA) zum Verfolgen von Workouts und Trainingsfortschritt.

## 🎯 Über das Projekt

FitTrack Pro ist eine benutzerfreundliche Fitness-App, die es ermöglicht, Workouts zu erstellen, Trainingseinheiten zu tracken und den eigenen Fortschritt zu visualisieren. Die App funktioniert vollständig offline und speichert alle Daten lokal auf dem Gerät.

## 🚀 Technologie-Stack

### Frontend
- **React 18.3** - Moderne UI-Library
- **TypeScript 5.8** - Type-sichere Entwicklung
- **Vite 5.4** - Schneller Build-Tool
- **Tailwind CSS 3.4** - Utility-first CSS Framework
- **shadcn/ui** - Hochwertige UI-Komponenten basierend auf Radix UI
- **React Router v6** - Client-side Routing
- **TanStack Query v5** - Daten-State-Management
- **Recharts** - Diagramme und Visualisierungen
- **PWA Support** - Installierbar und offline-fähig

### Datenverwaltung
- **localStorage** - Lokale Datenspeicherung
- Alle Daten bleiben auf dem Gerät des Benutzers

## ✨ Features

### Aktuell implementiert
- ✅ Benutzer-Authentifizierung (lokal)
- ✅ **Automatisches Zeit-Tracking** (Start/Ende/Dauer mit Live-Timer)
- ✅ **Körpergewicht-Tracking** pro Workout
- ✅ **Trainingspläne** erstellen, bearbeiten, starten
- ✅ **Push/Pull/Leg** vordefinierte Pläne
- ✅ Workout-Erstellung mit individueller Übungsauswahl
- ✅ Live-Workout-Tracking mit Sets, Gewicht und Wiederholungen
- ✅ **Workout-Notizen** auf Workout-Ebene
- ✅ **Sets löschen** mit Drei-Punkte-Menü
- ✅ **Workouts bearbeiten & löschen** im Bearbeiten-Modus
- ✅ Dashboard mit Übersicht über aktive und abgeschlossene Workouts
- ✅ **Gruppierung nach Monat** mit Trainings-Counter
- ✅ **Erweiterte Statistiken:**
  - Gesamtstatistik (Trainings, Dauer, Sets, Reps, Volumen, Durchschnitte)
  - Übungs-Statistiken (Top 10 mit Volumen, Max-Gewicht)
  - Kategorien-Statistiken (Muskelgruppen mit Bar Chart)
- ✅ Persönliche Rekorde pro Übung
- ✅ 1RM Progression Charts
- ✅ **Bessere Workout-Cards** mit Übungsliste und Dauer
- ✅ **Verbessertes Set-Layout** mit kreisförmigen Nummern
- ✅ 22+ vordefinierte Übungen in 6 Kategorien
- ✅ **Lock Screen Notifications** - Live-Timer auf dem Lock Screen während aktivem Training
- ✅ **Wake Lock API** - Bildschirm bleibt während des Trainings wach
- ✅ **App Badge** - Trainingsdauer als Badge auf dem App-Icon
- ✅ **Persistent Notifications** mit Live-Updates (alle 10 Sekunden)
- ✅ Responsive Mobile-First Design
- ✅ Progressive Web App (PWA) - installierbar
- ✅ Offline-Funktionalität
- ✅ Dark/Light Mode Support (via Tailwind)

### Übungskategorien
- Brust (Bankdrücken, Fliegende, etc.)
- Rücken (Kreuzheben, Klimmzüge, Rudern)
- Beine (Kniebeugen, Beinpresse, etc.)
- Schultern (Schulterdrücken, Seitheben)
- Arme (Bizeps Curls, Trizeps Dips)
- Core (Planks, Crunches)

## 📦 Installation & Setup

### Voraussetzungen
- Node.js (v18 oder höher)
- npm oder yarn

### Installation

```bash
# Repository klonen
git clone <repository-url>

# In Projekt-Verzeichnis wechseln
cd fittrack-pro

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Production
npm run build

# Production Build testen
npm run preview
```

Die App läuft standardmäßig auf `http://localhost:8080`

## 🏗️ Projektstruktur

```
fittrack-pro/
├── src/
│   ├── components/       # React-Komponenten
│   │   ├── ui/          # shadcn/ui Basis-Komponenten
│   │   ├── BottomNav.tsx
│   │   ├── NavLink.tsx
│   │   └── WorkoutCard.tsx
│   ├── hooks/           # Custom React Hooks
│   ├── lib/             # Utility-Funktionen
│   │   ├── auth.tsx     # Auth-System (localStorage-basiert)
│   │   ├── notifications.ts # Notification & Wake Lock Management
│   │   ├── exercises.ts # Übungskatalog
│   │   └── utils.ts     # Helper-Funktionen
│   ├── pages/           # Seiten-Komponenten
│   │   ├── Dashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── NewWorkout.tsx
│   │   ├── ActiveWorkout.tsx
│   │   ├── Stats.tsx
│   │   └── Profile.tsx
│   ├── App.tsx          # Haupt-App-Komponente
│   ├── main.tsx         # Entry Point
│   └── index.css        # Globale Styles
├── public/              # Statische Assets
└── dist/                # Build-Output
```

## 💾 Datenspeicherung

Die App verwendet localStorage für die Datenspeicherung:

- `fittrack_user` - Benutzer-Informationen
- `fittrack_workouts` - Liste aller Workouts
- `fittrack_workout_{id}_exercises` - Übungen pro Workout
- `fittrack_workout_{id}_sets` - Sets/Sätze pro Workout
- `fittrack_custom_exercises` - Benutzerdefinierte Übungen

## 🔔 Lock Screen & Notification Features

FitTrack Pro bietet erweiterte Notification-Features für ein optimales Training-Erlebnis:

### Persistent Training Notification
Während eines aktiven Trainings wird eine dauerhafte Benachrichtigung angezeigt mit:
- ⏱️ **Live-Timer** - Aktuelle Trainingsdauer
- 💪 **Aktuelle Übung** - Was du gerade trainierst
- 📊 **Fortschritt** - Wie viele Übungen noch fehlen
- 🔄 **Auto-Update** - Alle 10 Sekunden aktualisiert

Die Notification ist sichtbar:
- ✅ Auf dem Lock Screen
- ✅ Im Notification Center
- ✅ Als persistente Benachrichtigung

### Wake Lock - Bildschirm bleibt wach
- 📱 Kein nerviges Entsperren zwischen Sätzen
- 🔋 Automatische Aktivierung bei Training-Start
- 🧹 Automatische Deaktivierung bei Training-Ende

### App Badge
- 🏷️ Zeigt Trainingsdauer auf dem App-Icon
- 🔢 Update in Echtzeit
- 🧹 Wird nach Training automatisch gelöscht

**Mehr Details:** Siehe [NOTIFICATION_FEATURES.md](./NOTIFICATION_FEATURES.md)

### Browser-Unterstützung
| Feature | Chrome/Edge | Safari | Firefox |
|---------|-------------|--------|---------|
| Lock Screen Notifications | ✅ | ✅ | ✅ |
| Wake Lock | ✅ | ✅ (iOS 16.4+) | ⚠️ |
| App Badge | ✅ | ⚠️ | ❌ |

## 🔄 Änderungen vom Original

### Entfernt
- ❌ Supabase Backend-Integration
- ❌ Externe Datenbank-Abhängigkeit
- ❌ Externe Auth-Provider

### Hinzugefügt
- ✅ Lokales Auth-System
- ✅ localStorage-basierte Datenverwaltung
- ✅ Mock-Daten für Demo-Zwecke
- ✅ Vollständig offline-fähig

## 🚀 Geplante Erweiterungen

Für die Zukunft mit eigenem Backend:

- [ ] Eigenes Backend (Node.js/Express oder FastAPI)
- [ ] PostgreSQL/MongoDB Datenbank
- [ ] Cloud-Synchronisation
- [ ] Multi-Device Support
- [ ] Soziale Features (Freunde, Challenges)
- [ ] **Export-Funktionen** (PDF, CSV, Excel)
- [ ] Import von anderen Apps
- [ ] Workout-Templates teilen
- [ ] Timer und Rest-Tracking während Sets
- [ ] Foto-Upload für Progress-Pics
- [ ] Ernährungs-Tracking
- [ ] Integration mit Fitness-Trackern
- [ ] Workout-Empfehlungen basierend auf Historie

## 📱 PWA Installation

Die App kann als Progressive Web App auf dem Smartphone installiert werden:

**iOS:**
1. App in Safari öffnen
2. Teilen-Button drücken
3. "Zum Home-Bildschirm" wählen

**Android:**
1. App in Chrome öffnen
2. Menü öffnen (drei Punkte)
3. "App installieren" oder "Zum Startbildschirm hinzufügen"

## 🔒 Datenschutz

- Alle Daten werden lokal auf dem Gerät gespeichert
- Keine Datenübertragung an externe Server
- Keine Analytics oder Tracking
- Vollständige Kontrolle über eigene Daten

## 🛠️ Development

### Verfügbare Scripts

```bash
npm run dev          # Entwicklungsserver starten
npm run build        # Production Build erstellen
npm run preview      # Build lokal testen
npm run lint         # Code-Linting
```

### Code-Qualität

- TypeScript für Type-Safety
- ESLint für Code-Qualität
- Moderne React Patterns (Hooks, Context)
- Komponentenbasierte Architektur

## 📄 Lizenz

[Lizenz hier einfügen]

## 👨‍💻 Autor


---

**Version:** 1.0.0  
**Letzte Aktualisierung:** November 2025
