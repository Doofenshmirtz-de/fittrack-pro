# FitTrack Pro - Projektplan

## Überblick

FitTrack Pro ist eine mobile-first Fitness-Tracking PWA (Progressive Web App) zum Erfassen und Analysieren von Trainingseinheiten. Die App läuft vollständig client-seitig und speichert alle Daten im localStorage.

**Aktueller Status:** Beta - Funktionsfähig, bereit für weitere Optimierungen  
**Letzte Aktualisierung:** Mai 2026

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

---

## Projektstruktur

```
fittrack-pro/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui Basis-Komponenten
│   │   ├── BottomNav.tsx    # Bottom Navigation
│   │   ├── NavLink.tsx      # Navigation Link
│   │   └── WorkoutCard.tsx  # Workout Card Komponente
│   ├── hooks/
│   │   ├── use-mobile.tsx   # Mobile Detection
│   │   └── use-toast.ts     # Toast Hook
│   ├── lib/
│   │   ├── auth.tsx         # Authentifizierung (localStorage)
│   │   ├── exercises.ts     # Übungsdatenbank (114 Übungen)
│   │   └── utils.ts         # Utility-Funktionen
│   ├── pages/
│   │   ├── Auth.tsx         # Login/Register
│   │   ├── Dashboard.tsx    # Hauptübersicht
│   │   ├── NewWorkout.tsx   # Neues Workout erstellen
│   │   ├── ActiveWorkout.tsx # Aktives Training
│   │   ├── WorkoutPlans.tsx  # Trainingspläne verwalten
│   │   ├── Stats.tsx        # Statistiken & Charts
│   │   ├── Profile.tsx      # Profilseite
│   │   └── NotFound.tsx     # 404 Seite
│   ├── App.tsx              # Haupt-App Komponente
│   ├── main.tsx             # Entry Point
│   └── index.css            # Globale Styles
├── public/                  # Statische Assets
└── package.json             # Dependencies
```

---

## Features (implementiert)

### Core Features
- [x] Benutzer-Authentifizierung (lokal, Mock-basiert)
- [x] Workout-Erstellung mit individuellem Namen
- [x] Live-Workout-Tracking mit Sets, Gewicht, Wiederholungen
- [x] 114+ vordefinierte Übungen in 7 Kategorien
- [x] Eigene Übungen erstellen
- [x] Automatische Zeit-Erfassung (Start/Ende)
- [x] Live-Timer im aktiven Workout

### Daten & Statistiken
- [x] Körpergewicht-Tracking pro Workout
- [x] Workout-Level Notizen
- [x] Gesamtstatistiken (Trainings, Dauer, Sets, Reps, Volumen)
- [x] Übungs-Statistiken (Top 10 mit Details)
- [x] Kategorien-Statistiken (Muskelgruppen-Verteilung)
- [x] Personal Records pro Übung
- [x] 1RM Progression Charts (Bankdrücken)
- [x] Monats-Gruppierung mit Trainings-Counter

### Trainingspläne
- [x] Vordefinierte Pläne: Push Day, Pull Day, Leg Day
- [x] Eigene Pläne erstellen/bearbeiten/löschen
- [x] Pläne duplizieren
- [x] Workout aus Plan starten

### Bearbeitung & Löschung
- [x] Workouts bearbeiten (Fortsetzen abgeschlossener)
- [x] Workouts löschen mit Bestätigung
- [x] Einzelne Sets löschen
- [x] Zeit/Datum nachträglich anpassen

### UX/UI
- [x] Responsive Mobile-First Design
- [x] Dark/Light Mode Support
- [x] PWA-fähig (installierbar)
- [x] Workout-Cards mit Übungsliste und Dauer
- [x] Set-Layout mit kreisförmigen Nummern
- [x] Dropdown-Menüs für Aktionen

---

## Data Storage (localStorage)

| Key | Inhalt |
|-----|--------|
| `fittrack_user` | Benutzer-Informationen |
| `fittrack_workouts` | Liste aller Workouts |
| `fittrack_workout_{id}_sets` | Sets pro Workout |
| `fittrack_workout_{id}_exercises` | Übungen pro Workout |
| `fittrack_plans` | Trainingspläne |
| `fittrack_custom_exercises` | Benutzerdefinierte Übungen |

---

## Bekannte Bugs & Probleme

### Kritisch
- [x] **WorkoutPlans.tsx**: Bei `handleStartWorkout` wird `plan.exercises` gespeichert, aber in `ActiveWorkout.tsx` wird nie darauf zugegriffen - die Übungen aus dem Plan werden nicht automatisch geladen ✅ FIXED
- [x] **Dashboard.tsx**: `handleRepeatWorkout` kopiert die Sets nicht vom alten Workout - nur ein leeres Workout wird erstellt ✅ FIXED

### Mittel
- [ ] **ActiveWorkout.tsx**: Keine Eingabevalidierung für Gewicht/Reps (negative Werte möglich)
- [ ] **Stats.tsx**: 1RM Chart nur für Bankdrücken hardcoded - sollte für alle Übungen verfügbar sein
- [ ] **WorkoutCard.tsx**: Bei vielen Übungen wird die Card zu lang (kein Limit)

### Klein
- [ ] **Auth.tsx**: Mock-Authentifizierung akzeptiert beliebige Passwörter (nur für Demo)
- [ ] **ActiveWorkout.tsx**: Zeit-Edit Dialog erlaubt Endzeit vor Startzeit (wird zwar korrigiert, aber UX könnte besser sein)

---

## Geplante Features (Roadmap)

### Phase 1 - Stabilisierung (aktuell)
- [ ] Bugs beheben (siehe oben)
- [ ] Code-Refactoring für bessere Wartbarkeit
- [ ] TypeScript-Typen konsolidieren

### Phase 2 - Daten-Export/Import
- [ ] CSV-Export für Workouts
- [ ] Excel-Export
- [ ] JSON-Backup/Restore
- [ ] Daten-Import aus anderen Apps

### Phase 3 - Erweiterte Features
- [ ] Ruhezeiten-Timer zwischen Sätzen
- [ ] Trainings-Ziele setzen
- [ ] Gewichts-Verlauf über Zeit
- [ ] Foto-Upload für Progress-Pics

### Phase 4 - Cloud (optional)
- [ ] Backend-Integration (Supabase/Firebase)
- [ ] Multi-Device Sync
- [ ] Sichere Cloud-Speicherung

---

## Übungskategorien

| Kategorie | Anzahl |
|-----------|--------|
| Brust | 13 |
| Rücken | 17 |
| Beine | 14 |
| Schultern | 11 |
| Arme (Bizeps) | 8 |
| Arme (Trizeps) | 8 |
| Core | 11 |
| Cardio | 7 |
| **Gesamt** | **89** |

---

## Änderungshistorie

### Mai 2026 - Reaktivierung
- Notification-Funktionalität entfernt (iOS-Probleme)
- Projektplan.md erstellt
- Alte Dokumentationsdateien bereinigt

### November 2025 - Major Update
- Automatisches Zeit-Tracking hinzugefügt
- Körpergewicht-Tracking implementiert
- Trainingspläne (Push/Pull/Leg) erstellt
- Erweiterte Statistiken mit Tabs
- Workout bearbeiten & löschen
- Sets löschen
- Monats-Gruppierung

### Oktober 2025 - Initial
- Basis-App mit React + Vite
- Supabase-Integration (später entfernt)
- localStorage-Implementierung
- 22 Grundübungen

---

## Development

### Installation
```bash
cd fittrack-pro
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Port
- Development: `http://localhost:8080`

---

## Hinweise

- App ist vollständig offline-fähig
- Alle Daten bleiben auf dem Gerät
- Kein Backend erforderlich für Basis-Funktionalität
- PWA-Installation für beste mobile Erfahrung empfohlen

---

**Version:** 1.0.0  
**Status:** Funktionsfähig, bereit für Bugfixes
