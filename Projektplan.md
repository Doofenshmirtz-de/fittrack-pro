# FitTrack Pro - Projektplan

## Überblick

FitTrack Pro ist eine mobile-first Fitness-Tracking PWA (Progressive Web App) zum Erfassen und Analysieren von Trainingseinheiten. Die App nutzt **Firebase** für Authentifizierung und Cloud-Datenspeicherung.

**Aktueller Status:** 🔧 In Entwicklung - Firebase Integration implementiert, Tests ausstehend  
**Letzte Aktualisierung:** 22. Mai 2026  
**Git Branch:** `Pro`

---

## Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | React 18.3 mit TypeScript 5.8 |
| Build Tool | Vite 5.4 |
| Styling | Tailwind CSS 3.4 |
| UI-Komponenten | shadcn/ui (basierend auf Radix UI) |
| State Management | TanStack Query v5 |
| Routing | React Router v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner (Toast) |
| **Backend** | **Firebase (Auth + Firestore)** |
| **Testing** | **Vitest + Testing Library** |

---

## Projektstruktur

```
fittrack-pro/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui Basis-Komponenten
│   │   ├── BottomNav.tsx    # Bottom Navigation
│   │   ├── WorkoutCard.tsx  # Workout Card Komponente
│   │   └── ErrorBoundary.tsx # Error Handling
│   ├── hooks/
│   │   ├── use-mobile.tsx   # Mobile Detection
│   │   └── use-toast.ts     # Toast Hook
│   ├── lib/
│   │   ├── auth.tsx         # Firebase Authentifizierung
│   │   ├── firebase.ts      # Firebase SDK Initialisierung
│   │   ├── firestore.ts     # Firestore Service Layer (CRUD)
│   │   ├── exercises.ts     # Übungsdatenbank (89 Übungen)
│   │   └── utils.ts         # Utility-Funktionen
│   ├── pages/
│   │   ├── Auth.tsx         # Login/Register (Firebase Auth)
│   │   ├── Dashboard.tsx    # Hauptübersicht (Firestore)
│   │   ├── NewWorkout.tsx   # Neues Workout (Firestore)
│   │   ├── ActiveWorkout.tsx # Aktives Training (Firestore)
│   │   ├── WorkoutPlans.tsx  # Trainingspläne (Firestore)
│   │   ├── Stats.tsx        # Statistiken
│   │   ├── Profile.tsx      # Profilseite
│   │   ├── Debug.tsx        # Debug/Diagnose-Seite
│   │   └── NotFound.tsx     # 404 Seite
│   ├── test/
│   │   └── setup.ts         # Test-Konfiguration
│   ├── App.tsx              # Haupt-App Komponente
│   ├── main.tsx             # Entry Point mit Error Handling
│   └── index.css            # Globale Styles
├── public/
│   └── favicon.svg          # App-Icon (kein Lovable mehr)
├── .cursor/
│   └── mcp.json            # Firebase MCP Server Config
├── .env.local              # Firebase API Keys (NICHT im Git!)
├── firestore.rules          # Firestore Security Rules
├── firestore.indexes.json    # Firestore Composite Indexes
├── firebase.json            # Firebase Projekt-Konfiguration
├── vitest.config.ts         # Vitest Test-Konfiguration
└── package.json             # Dependencies
```

---

## Features (implementiert)

### Core Features
- [x] Benutzer-Authentifizierung (Firebase Auth - E-Mail/Passwort)
- [x] Workout-Erstellung mit individuellem Namen (Firestore)
- [x] Live-Workout-Tracking mit Sets, Gewicht, Wiederholungen (Firestore)
- [x] 89 vordefinierte Übungen in 7 Kategorien
- [x] Eigene Übungen erstellen (localStorage)
- [x] Automatische Zeit-Erfassung (Start/Ende)
- [x] Live-Timer im aktiven Workout

### Daten & Statistiken
- [x] Körpergewicht-Tracking pro Workout (Firestore)
- [x] Workout-Level Notizen (Firestore)
- [x] Gesamtstatistiken (Trainings, Dauer, Sets, Reps, Volumen)
- [x] Übungs-Statistiken (Top 10 mit Details)
- [x] Kategorien-Statistiken (Muskelgruppen-Verteilung)
- [x] Personal Records pro Übung
- [x] 1RM Progression Charts (Bankdrücken)
- [x] Monats-Gruppierung mit Trainings-Counter

### Trainingspläne
- [x] Vordefinierte Pläne: Push Day, Pull Day, Leg Day
- [x] Eigene Pläne erstellen/bearbeiten/löschen (Firestore)
- [x] Pläne duplizieren
- [x] Workout aus Plan starten (mit Übungs-Vorlage)

### Bearbeitung & Löschung
- [x] Workouts bearbeiten (Fortsetzen abgeschlossener)
- [x] Workouts löschen mit Bestätigung (Firestore)
- [x] Einzelne Sets löschen (Firestore)
- [x] Zeit/Datum nachträglich anpassen

### UX/UI
- [x] Responsive Mobile-First Design
- [x] Dark/Light Mode Support
- [x] PWA-fähig (installierbar)
- [x] Workout-Cards mit Übungsliste und Dauer
- [x] Set-Layout mit kreisförmigen Nummern
- [x] Dropdown-Menüs für Aktionen
- [x] Debug-Seite für Diagnose
- [x] Error Boundary für App-Abstürze

### Testing
- [x] Vitest eingerichtet
- [x] 31 Tests implementiert
- [x] Automatische Tests nach jedem Build

---

## Data Storage

### Firestore (Cloud)
| Collection | Felder |
|------------|--------|
| `workouts` | userId, name, startedAt, completedAt, isActive, bodyWeight, notes |
| `sets` | workoutId, userId, exercise, setNumber, weight, reps, notes, completedAt |
| `plans` | userId, name, description, exercises, createdAt |

### Security Rules
- ✅ User können nur eigene Daten lesen/schreiben
- ✅ Authentifizierung erforderlich
- ⚠️ **Müssen in Firebase Console veröffentlicht werden!**

### Local (Backup)
| Key | Inhalt |
|-----|--------|
| `fittrack_custom_exercises` | Benutzerdefinierte Übungen |

---

## 🔴 Aktuelle Probleme & Blocker

### 🔥 KRITISCH (App nicht funktionsfähig)

#### 1. Firebase API Key nicht geladen
**Status:** ❌ BLOCKER  
**Symptom:** `auth/invalid-api-key` Fehler  
**Ursache:** Vite lädt `.env.local` nicht korrekt  
**Lösung:** 
```bash
# Server neu starten
Ctrl+C
cd fittrack-pro
npm run dev

# Falls nicht hilft:
rm -rf node_modules/.vite dist
npm run dev
```

#### 2. Firestore Security Rules nicht veröffentlicht
**Status:** ❌ BLOCKER  
**Symptom:** `Missing or insufficient permissions`  
**Lösung:** 
1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Wähle Projekt `fittrack-pro-eabdb`
3. Firestore Database → Rules
4. Füge folgende Rules ein:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /workouts/{workoutId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    match /sets/{setId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    match /plans/{planId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```
5. Klicke **"Veröffentlichen"**

#### 3. Firestore Indexes fehlen
**Status:** ❌ BLOCKER  
**Symptom:** `The query requires an index`  
**Lösung:** Erstelle in Firebase Console:

**Index 1: workouts**
- Feld: `userId` (Aufsteigend)
- Feld: `startedAt` (Absteigend)

**Index 2: plans**
- Feld: `userId` (Aufsteigend)
- Feld: `createdAt` (Absteigend)

---

### 🟡 MITTEL (Funktional, aber verbesserungswürdig)

- [ ] **ActiveWorkout.tsx**: Keine Eingabevalidierung für Gewicht/Reps (negative Werte möglich)
- [ ] **Stats.tsx**: 1RM Chart nur für Bankdrücken hardcoded
- [ ] **WorkoutCard.tsx**: Bei vielen Übungen wird die Card zu lang

### 🟢 KLEIN (Kosmetik)

- [ ] **ActiveWorkout.tsx**: Zeit-Edit Dialog UX verbessern

---

## ✅ Bereits erledigt (Letzte Commits)

| Commit | Datum | Inhalt |
|--------|-------|--------|
| `fb2fcd4` | 22.05. | Favicon ersetzt (Lovable entfernt) + Error Handling |
| `3b7275b` | 22.05. | Bessere Fehlermeldungen für Firestore |
| `592edab` | 22.05. | Alle Komponenten auf Firestore umgestellt |
| `c284596` | 19.05. | Bugfixes + 31 automatische Tests |
| `07480a8` | 19.05. | Firebase Integration vollständig |
| `074fc22` | 19.05. | Reaktivierung: Notifications entfernt |

---

## 🚀 Nächste Schritte

### Sofort (Blocker beheben):
1. ✅ Firebase API Key in `.env.local` prüfen
2. 🔄 Firestore Security Rules veröffentlichen (oben beschrieben)
3. 🔄 Firestore Indexes erstellen (oben beschrieben)
4. 🔄 Server neu starten

### Danach:
5. Debug-Seite öffnen → "Verbindung testen"
6. Neues Workout erstellen testen
7. Alte Bugs beheben (Mittel/Klein)

---

## 🛠️ Development

### Installation & Start
```bash
cd fittrack-pro
npm install
npm run dev
```

### Wichtige Commands
```bash
npm run dev          # Development Server
npm run build        # Production Build + Tests
npm run test         # Tests im Watch-Modus
npm run test:run     # Tests einmal ausführen
```

### Port
- Development: `http://localhost:8080`

---

## 🔒 Sicherheit

### API Keys
- ✅ In `.env.local` gespeichert
- ✅ `.env.local` in `.gitignore` (wird nie committed)
- ✅ Hardcoded Keys wurden entfernt
- ⚠️ **WICHTIG:** Rotiere den API Key falls er jemals committed wurde

### Firestore Rules
- ✅ Sichere Rules definiert in `firestore.rules`
- ❌ Noch nicht in Firebase Console veröffentlicht

---

## 📊 Tests

| Test-Datei | Tests | Status |
|------------|-------|--------|
| `auth.test.ts` | 13 | ✅ Pass |
| `exercises.test.ts` | 11 | ✅ Pass |
| `workout.test.tsx` | 7 | ✅ Pass |
| **Gesamt** | **31** | **✅ Alle Pass** |

---

**Version:** 1.0.0  
**Status:** 🔧 Firebase-Integration implementiert, wartet auf Server-Konfiguration  
**Branch:** `Pro`
