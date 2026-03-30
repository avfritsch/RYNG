# RYNG — Wettbewerbsanalyse & Strategische Implikationen

*Stand: März 2026*

---

## RYNG Feature-Profil

RYNG ist eine deutschsprachige Fitness-Timer PWA (React/TypeScript/Vite/Supabase) mit folgenden Kernfeatures:

- Zirkel-/Intervall-Timer mit Arbeits-/Pausenphasen
- Mehrtägige Trainingspläne mit Übungen, Runden, Rundenpausen
- Übungsbibliothek (76+ Übungen) mit Kategorien, Muskelgruppen, Equipment, Howto-Anleitungen
- Drag & Drop Übungsreihenfolge
- Session-Verlauf mit Volumen-Charts
- Smart Start Dashboard
- Light/Dark Mode
- PWA (offline-fähig, installierbar)
- Komplett kostenlos, keine Werbung

---

## Konkurrenzübersicht

### Featurevergleich

| Feature | **RYNG** | **Seconds Pro** | **SmartWOD** | **Timer Plus** | **Tabata Timer** | **JEFIT** | **Fitbod** | **Interval Timer** | **Keelo** | **Exercise Timer** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Plattform** | PWA (Web) | iOS, Android, Web | iOS, Android | iOS | iOS, Android | iOS, Android | iOS, Android | iOS, Android | iOS, Android | iOS, Android, Web |
| **Zirkeltraining-Timer** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Trainingspläne (Tage/Übungen)** | ✅ mehrtägig | ❌ nur Presets | ❌ nur Timer | ❌ | ❌ | ✅ | ✅ (KI) | ❌ | ✅ (KI) | ❌ |
| **Übungsbibliothek** | ✅ 76+ mit Howto | ❌ | ❌ | ❌ | ❌ | ✅ 1400+ Video | ✅ 1000+ Video | ❌ | ✅ Video | ❌ |
| **Muskelgruppen-Filter** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Equipment-Filter** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Drag & Drop Reihenfolge** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Session-Verlauf/Statistiken** | ✅ Charts | ❌ | Rundenzeiten | ✅ Historie | ❌ | ✅ detailliert | ✅ detailliert | ❌ | ✅ | ❌ |
| **Warmup als eigene Phase** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Runden + Rundenpausen** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Sprachansagen** | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Video/Animationen** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | GIFs |
| **Apple Watch** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Offline-fähig** | ✅ (PWA) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dark Mode** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Musik-Integration** | ❌ | ✅ pro Intervall | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **KI-Features** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Plangestaltung | ❌ | ✅ | ❌ |
| **Social/Sharing** | ❌ | ✅ Export | ❌ | ❌ | ❌ | ✅ Community | ✅ | ❌ | ❌ | ❌ |
| **Gewicht/Wdh-Tracking** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Mehrsprachig** | nur DE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | EN only | ✅ |

### Preisvergleich

| App | Kostenlos | Preis |
|---|---|---|
| **RYNG** | ✅ komplett | Kostenlos |
| **Seconds Pro** | eingeschränkt | ~7€ einmalig |
| **SmartWOD** | eingeschränkt | 1,99€/Monat oder 35,99€ Lifetime |
| **Timer Plus** | ✅ | Kostenlos (IAP optional) |
| **Tabata Timer** | ✅ | Kostenlos (Premium optional) |
| **JEFIT** | mit Werbung | 12,99€/Monat oder 69,99€/Jahr |
| **Fitbod** | 3 Workouts gratis | 15,99€/Monat oder 95,99€/Jahr |
| **Interval Timer** | ✅ | Kostenlos |
| **Keelo** | eingeschränkt | 12,99€/Monat |
| **Exercise Timer** | mit Werbung | Pro-Kauf (einmalig) |

### Weitere erwähnenswerte Apps

| App | Plattform | Besonderheit |
|---|---|---|
| **Intervals Pro** | iOS, Apple Watch | Tiefste Apple-Integration (Health, Siri, Strava), HR-Zonen, distanzbasiert |
| **O'Coach** | iOS, Android | Adaptive HIIT-Routinen, Coaching-Ansatz |
| **PF Circuit Training** | Android (Open Source) | Datenschutz-fokussiert, vom KIT Karlsruhe, GPLv3, F-Droid |
| **Tabata Workout App** | iOS, Android | 180+ Übungen mit Schwierigkeitsgrad, 15-90 Tage Pläne |
| **HIIT Timer PWA** | Web (PWA) | Minimaler PWA-Timer, Open Source, kein Account nötig |

---

## RYNGs Stärken (USP)

1. **Einzige echte PWA** — kein App Store nötig, läuft überall im Browser
2. **Timer + Pläne + Bibliothek in einem** — Timer-Apps haben keine Pläne, Planungs-Apps keinen Zirkeltimer
3. **Komplett kostenlos** ohne Werbung oder Abo-Zwang
4. **Deutsche Übungsbibliothek** mit Howto-Anleitungen
5. **Warmup als eigene Trainingsphase** im Plan integriert
6. **Drag & Drop** Übungsreihenfolge

---

## RYNGs Schwächen vs. Konkurrenz

1. **Keine Videos/Animationen** — JEFIT und Fitbod haben Video-Demos für jede Übung
2. **Keine Apple Watch** — fast alle Konkurrenten unterstützen Wearables
3. **Keine Sprachansagen** — Seconds Pro und SmartWOD sprechen Übungsnamen vor
4. **Keine KI-Planerstellung** — Fitbod generiert Pläne automatisch
5. **Kleine Übungsdatenbank** (76 vs. 1000+)
6. **Kein Social/Community-Feature**
7. **Kein Gewichts-/Wiederholungs-Tracking**
8. **Nur Deutsch** — Markt auf ~100M Muttersprachler begrenzt

---

## Kritische Lücken für 10M+ Nutzer

### 1. Fehlende Grundlagen (Must-Haves)

**Video/Animation pro Übung**
Größter einzelner Blocker. Kein Casual-Nutzer versteht "Rumänisches Kreuzheben" aus Text. Fitbod und JEFIT haben Video-Demos — das erwarten Nutzer heute. Ohne das geht jeder Anfänger sofort verloren.

**Sprachansagen / TTS**
Während eines Workouts schaut niemand aufs Handy. Timer-Apps wie Seconds Pro sprechen Übungsnamen vor, geben Countdowns und Hinweise auf die nächste Übung. Ohne das fühlt sich der Timer blind an.

**Onboarding / First-Run Experience**
Aktuell öffnet sich die App und der Nutzer steht vor einem leeren Dashboard. Kein Fitnesslevel, kein Ziel, kein geführter erster Workout. 80% der Nutzer entscheiden in den ersten 30 Sekunden ob sie bleiben.
- Fitness-Level + Ziel-Abfrage
- Sofort passender Workout-Vorschlag
- "Starte jetzt in 1 Tap"

### 2. Retention-Killer (Warum Nutzer nach 1 Woche aufhören)

**Kein Fortschrittssystem / Gamification**
Keine Streaks, Badges, Levels, Wochenziele. Duolingo hat bewiesen: Gamification ist der #1 Retention-Hebel.
- Streak-Counter mit Push-Erinnerung
- Wöchentliches Trainings-Ziel (z.B. 3x/Woche)
- Meilensteine ("50 Workouts geschafft!")

**Keine Push-Notifications**
PWA ohne Push-Reminders verliert Nutzer still. "Hey, du hast seit 3 Tagen nicht trainiert" bringt Leute zurück. PWA Push ist seit 2023 auf iOS möglich.

**Keine Progression / Periodisierung**
Plan bleibt statisch. Kein "Woche 3: +5s Work-Time" oder automatische Steigerung. Fitbod macht das automatisch. Ohne Progression ist RYNG ein Werkzeug, keine Coaching-Erfahrung.

### 3. Wachstums-Blocker (Warum du nicht viral gehst)

**Keine Social Features**
- Kein "Workout mit Freund teilen" per Link
- Keine Challenges ("Wer schafft mehr Sessions diese Woche?")
- Keine öffentlichen Pläne von anderen Nutzern
- Kein Leaderboard
Social ist der billigste Wachstumskanal. Jeder geteilte Workout-Screenshot ist gratis Marketing.

**Keine Native App (App Store Präsenz)**
PWAs erreichen keine 10M Nutzer. 95% suchen im App Store / Play Store. Nötig:
- Play Store Listing (TWA / Trusted Web Activity wrappt die PWA)
- iOS App Store (Capacitor oder React Native Wrapper)
- App Store Optimization (ASO) — der #1 Discovery-Kanal

**Kein Content-Marketing / SEO**
Kein Blog, keine Workout-Anleitungen, keine YouTube-Präsenz. Fitbod hat 100+ SEO-Artikel. "Bester Ganzkörper-Zirkeltraining Plan" sollte zu RYNG führen.

### 4. Produkt-Lücken vs. Marktführer

**Kein Gewichts-/Wiederholungs-Tracking**
RYNG ist zeitbasiert — aber viele Kraftübungen brauchen Sätze × Wiederholungen × Gewicht. Ohne das verliert man die gesamte Gym-Zielgruppe an JEFIT/Strong/Hevy.

**Keine Musik-Integration**
Spotify/Apple Music im Workout. SmartWOD und Seconds steuern Musik pro Phase. Für viele Nutzer ein Dealbreaker.

**Keine Wearable-Anbindung**
Apple Watch, Wear OS, Garmin — Fitness-Nutzer tragen Uhren. Herzfrequenz-Zonen, Kalorien, Workout vom Handgelenk starten.

**Kein Multi-Language Support**
76 Übungen nur auf Deutsch begrenzt den Markt auf ~100M Muttersprachler. Englisch würde den adressierbaren Markt 20x vergrößern.

---

## Monetarisierung

Ohne Einnahmen kein Wachstum — keine Server, kein Marketing-Budget, keine Entwickler.

| Modell | Beispiel | Potenzial |
|---|---|---|
| **Freemium** | Basis gratis, Pro für Pläne/Analytics/AI | Bewährt (Fitbod, JEFIT) |
| **Abo** | 4,99€/Monat für Premium | Recurring Revenue |
| **Creator-Marktplatz** | Trainer verkaufen Pläne, 20% Provision | Netzwerkeffekt |
| **B2B/Gym-Lizenzen** | Studios nutzen RYNG für Kurse | Hoher ARPU |

---

## Priorisierte Roadmap

| Phase | Was | Warum |
|---|---|---|
| **Sofort** | Onboarding-Flow, Push-Notifications, Streaks | Retention retten |
| **Q2 2026** | Video/GIF pro Übung, Sprachansagen, i18n (EN) | Nutzererlebnis + Markt öffnen |
| **Q3 2026** | App Store (TWA + Capacitor), ASO | Discovery-Kanal #1 |
| **Q4 2026** | Social Sharing, Challenges, Freemium-Modell | Viralität + Revenue |
| **2027** | Apple Watch, Reps/Weight-Tracking, AI Coach | Feature-Parity mit Marktführern |

---

## Fazit

RYNG hat ein starkes Fundament — die Kombination Timer + Pläne + Bibliothek in einer App ist einzigartig am Markt. Kein Konkurrent bietet das in dieser Form.

Für 10M Nutzer fehlen jedoch:
1. **Videos und Sprachansagen** (Nutzererlebnis)
2. **App Store Präsenz** (Discovery)
3. **Social/Viral-Mechaniken** (Wachstum)
4. **Gamification + Push** (Retention)
5. **Revenue-Modell** (Skalierbarkeit)

Die größte einzelne Maßnahme wäre ein **App Store Listing + gutes Onboarding** — das allein könnte die Nutzerzahl 100x steigern.

---

*Quellen: [Seconds Pro](https://www.intervaltimer.com/), [SmartWOD](https://www.smartwod.app/), [JEFIT](https://www.jefit.com), [Fitbod](https://fitbod.me/), [O'Coach](https://blog.ocoach.app/), [Intervals Pro](https://intervalspro.com/), [Exercise Timer](https://exercisetimer.net/), [Keelo](https://keelo.com/), [PF Circuit Training (KIT)](https://secuso.aifb.kit.edu/english/Interval_Timer_and_Circuit_Training.php), [Timer Plus](https://apps.apple.com/de/app/timer-plus-trainings-timer/id1279716547)*
