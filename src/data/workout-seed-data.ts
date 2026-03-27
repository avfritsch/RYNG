// ============================================================
// Ryng — Workout Seed Data
// Extrahiert aus ryng-training.html für Migration in React-App
// ============================================================

// --- Types ---

export interface WarmupExercise {
  name: string;
  detail: string;
  time: string;        // Anzeigetext, z.B. "5 Min"
  sec: number;         // Dauer in Sekunden
  muscle: string;
  howto: string;       // HTML-formatiert
}

export interface StrengthExercise {
  name: string;
  detail: string;
  muscle: string;
  howto: string;       // HTML-formatiert
}

export interface WorkoutDay {
  id: string;          // "A", "B", "C", "D"
  label: string;       // "Tag A"
  focus: string;       // "Push", "Pull", "Beine", "Ganzkörper"
  rounds: number;
  work: number;        // Default Work-Sekunden für Kraft-Übungen
  pause: number;       // Default Pause-Sekunden für Kraft-Übungen
  roundPause: number;  // Pause zwischen Runden
  warmupPause: number; // Pause zwischen Warmup-Stationen
  warmup: WarmupExercise[];
  exercises: StrengthExercise[];
}

// --- Data ---

export const WORKOUTS: WorkoutDay[] = [

  // ══════════════════════════════════════
  //  TAG A — PUSH
  // ══════════════════════════════════════
  {
    id: "A",
    label: "Tag A",
    focus: "Push",
    rounds: 3,
    work: 45,
    pause: 30,
    roundPause: 90,
    warmupPause: 10,

    warmup: [
      {
        name: "Laufband / Ruderergometer",
        detail: "Moderates Tempo",
        time: "5 Min",
        sec: 300,
        muscle: "Cardio",
        howto: "Lockeres Tempo, Puls auf 120–130 bpm. Laufband: Steigung 2–3 %. Rudern: Beine → Rücken → Arme.",
      },
      {
        name: "Schulterkreisen mit Band",
        detail: "Vorwärts & rückwärts",
        time: "1 Min",
        sec: 60,
        muscle: "Schultern",
        howto: "Widerstandsband mit weitem Griff. Arme gestreckt über Kopf und hinter Rücken. 10× vorwärts, 10× rückwärts.",
      },
      {
        name: "Cat-Cow + Thoracic Rotation",
        detail: "Kontrolliert",
        time: "2 Min",
        sec: 120,
        muscle: "Wirbelsäule",
        howto: "<strong>Cat-Cow:</strong> Vierfüßlerstand. Einatmen → Brust senken. Ausatmen → Rücken rund. 8–10 Wdh.<br><strong>Thoracic Rotation:</strong> Hand hinter Kopf, Ellbogen zum Boden, dann weit öffnen. 6× je Seite.",
      },
      {
        name: "Band Pull-Aparts",
        detail: "Schulterblätter zusammen",
        time: "1 Min",
        sec: 60,
        muscle: "Oberer Rücken",
        howto: "Band auf Schulterhöhe, Arme gestreckt. Auseinanderziehen bis Band die Brust berührt. 1 s halten. 15–20 Wdh.",
      },
      {
        name: "Inchworms + Push-Up",
        detail: "Dynamisch dehnen",
        time: "2 Min",
        sec: 120,
        muscle: "Ganzkörper",
        howto: "Aus dem Stand Hände zum Boden, nach vorne in Liegestützposition. Push-Up, zurück zu Füßen, aufrichten. 6–8 Wdh.",
      },
      {
        name: "Goblet Squat Hold",
        detail: "Leichte KH, Tiefposition",
        time: "2 Min",
        sec: 120,
        muscle: "Hüfte",
        howto: "Leichte KH (8–12 kg) vor Brust. Tiefe Kniebeuge, Ellbogen drücken Knie nach außen. 20–30 s halten, 3–4×.",
      },
      {
        name: "Wrist Stretches",
        detail: "Kreise und Beugung",
        time: "1 Min",
        sec: 60,
        muscle: "Unterarme",
        howto: "Arm strecken, Finger sanft dehnen (je 15 s pro Richtung). Handgelenke kreisen.",
      },
    ],

    exercises: [
      {
        name: "KH-Bankdrücken",
        detail: "Flach, kontrolliert",
        muscle: "Brust",
        howto: "Flachbank, je eine KH. Schulterblätter zusammen, Oberarme 45° zum Körper. 2 s runter, 1 s hoch.",
      },
      {
        name: "KH-Schulterdrücken",
        detail: "Sitzend",
        muscle: "Schultern",
        howto: "Sitzend, Rückenlehne ~85°. KH auf Schulterhöhe, nach oben drücken. Core anspannen.",
      },
      {
        name: "Kabelzug Seitheben",
        detail: "Einarmig",
        muscle: "Seitl. Schulter",
        howto: "Seitlich zum Kabelzug, unterer Anschlag. Arm mit leichter Beugung bis Schulterhöhe. Kein Schwung. Seite wechseln.",
      },
      {
        name: "Dips",
        detail: "Gerät oder Bank",
        muscle: "Trizeps / Brust",
        howto: "<strong>Gerät:</strong> Oberkörper leicht vorbeugen, bis Oberarme parallel. <strong>Bank:</strong> Hände hinter Körper, Ellbogen bis 90°. Schultern weg von Ohren.",
      },
      {
        name: "Trizeps Pushdown",
        detail: "Seil oder Stange",
        muscle: "Trizeps",
        howto: "Oberer Anschlag. Oberarme fixiert am Körper. Unterarme runterdrücken, beim Seil Enden auseinanderziehen. Zurück bis 90°.",
      },
      {
        name: "Pallof Press",
        detail: "Kabelzug, Anti-Rotation",
        muscle: "Core",
        howto: "Kabelzug auf Brusthöhe. Seitlich stehen, Griff beidhändig vor Brust. Arme strecken, 2 s halten — Core verhindert Rotation. 8–10 Wdh je Seite.",
      },
    ],
  },

  // ══════════════════════════════════════
  //  TAG B — PULL
  // ══════════════════════════════════════
  {
    id: "B",
    label: "Tag B",
    focus: "Pull",
    rounds: 3,
    work: 45,
    pause: 30,
    roundPause: 90,
    warmupPause: 10,

    warmup: [
      {
        name: "Ruderergometer / Crosstrainer",
        detail: "Moderates Tempo",
        time: "5 Min",
        sec: 300,
        muscle: "Cardio",
        howto: "Puls 120–130 bpm. Rudern: Beine → Rücken → Arme. Crosstrainer: aktiv ziehen.",
      },
      {
        name: "Band Dislocates",
        detail: "Weiter Griff",
        time: "1 Min",
        sec: 60,
        muscle: "Schultern",
        howto: "Band/Stab weit greifen. Arme gestreckt über Kopf und hinter Rücken. Bei Schmerz stoppen. 10–12 Wdh.",
      },
      {
        name: "Hängen am Klimmzuggriff",
        detail: "Passiv + aktiv",
        time: "1 Min",
        sec: 60,
        muscle: "Lat / Grip",
        howto: "<strong>Passiv (30 s):</strong> Entspannt hängen. <strong>Aktiv (30 s):</strong> Schulterblätter nach unten ziehen ohne Armbeugung.",
      },
      {
        name: "Thoracic Foam Roll",
        detail: "Oberen Rücken",
        time: "2 Min",
        sec: 120,
        muscle: "BWS",
        howto: "Rolle unter Schulterblätter. Hände hinter Kopf, langsam rollen. An festen Stellen 10–15 s. <strong>Nicht</strong> über LWS.",
      },
      {
        name: "Hip 90/90 Stretch",
        detail: "Beide Seiten",
        time: "2 Min",
        sec: 120,
        muscle: "Hüfte",
        howto: "Sitzend: Vorderes + hinteres Bein je 90° gebeugt. Oberkörper aufrecht. 30 s je Seite.",
      },
      {
        name: "Leichte KH Rows",
        detail: "Aufwärmsatz",
        time: "2 Min",
        sec: 120,
        muscle: "Oberer Rücken",
        howto: "Leichte KH (5–8 kg), 45° vorgebeugt. Beide zum Bauchnabel ziehen, Schulterblätter zusammen. 15–20 Wdh.",
      },
      {
        name: "Wrist Circles",
        detail: "Handgelenke",
        time: "1 Min",
        sec: 60,
        muscle: "Unterarme",
        howto: "Handgelenke kreisen (10× je Richtung). Faust ballen + öffnen (20×).",
      },
    ],

    exercises: [
      {
        name: "Klimmzüge / Lat Pulldown",
        detail: "Weiter Griff, volle ROM",
        muscle: "Latissimus",
        howto: "Schulterblätter zuerst runter, dann Arme beugen. Kinn über Stange. <strong>Pulldown:</strong> Stange zur oberen Brust.",
      },
      {
        name: "KH-Rudern einarmig",
        detail: "Bank als Stütze",
        muscle: "Oberer Rücken",
        howto: "Knie + Hand auf Bank. KH zum Hüftknochen ziehen, Ellbogen eng. Schulterblatt zusammenziehen, 1 s halten.",
      },
      {
        name: "Kabelzug Face Pulls",
        detail: "Seil, Daumen nach außen",
        muscle: "Hint. Schulter",
        howto: "Seil auf Gesichtshöhe. Zum Gesicht ziehen, Enden auseinander. Hände neben Ohren, Ellbogen hoch. 2 s halten.",
      },
      {
        name: "KH Bizeps-Curls",
        detail: "Abwechselnd, Supination",
        muscle: "Bizeps",
        howto: "KH seitlich, beim Hochführen Handgelenk nach außen drehen. Oberarm fixiert. 1 s hoch, Squeeze, 2 s runter.",
      },
      {
        name: "Reverse Fly Kabelzug",
        detail: "Vorgebeugt",
        muscle: "Hint. Schulter",
        howto: "Zwei Kabel unten, Griffe über Kreuz. Vorgebeugt, Arme seitlich nach oben/hinten. Schulterblätter zusammen.",
      },
      {
        name: "TRX Body Saw",
        detail: "Anti-Extension, Core",
        muscle: "Core",
        howto: "Füße in TRX, Unterarm-Stütz. Körper langsam vor/zurück schieben. Kleine Bewegung, maximale Rumpfspannung. Kein Durchhängen.",
      },
    ],
  },

  // ══════════════════════════════════════
  //  TAG C — BEINE
  // ══════════════════════════════════════
  {
    id: "C",
    label: "Tag C",
    focus: "Beine",
    rounds: 3,
    work: 45,
    pause: 30,
    roundPause: 90,
    warmupPause: 10,

    warmup: [
      {
        name: "Fahrrad / Laufband Incline",
        detail: "Steigung",
        time: "5 Min",
        sec: 300,
        muscle: "Cardio",
        howto: "Fahrrad: Widerstand mittel, 70–80 RPM. Laufband: 8–12 % Steigung, 4–5 km/h.",
      },
      {
        name: "Banded Crab Walks",
        detail: "Band um Knie",
        time: "1 Min",
        sec: 60,
        muscle: "Glutes",
        howto: "Mini-Band über Knie. Viertelhocke, 10 Schritte rechts, 10 links. Knie aktiv nach außen.",
      },
      {
        name: "Ausfallschritte",
        detail: "Ohne Gewicht",
        time: "2 Min",
        sec: 120,
        muscle: "Beine / Hüfte",
        howto: "Großer Schritt, hinteres Knie fast zum Boden, zurück. 8–10 je Seite.",
      },
      {
        name: "Leg Swings",
        detail: "Frontal & lateral",
        time: "1 Min",
        sec: 60,
        muscle: "Hüftflexoren",
        howto: "An Wand festhalten. Frontal: vor/zurück (10×). Lateral: seitlich (10×). Amplitude steigern.",
      },
      {
        name: "Goblet Squat + Pause",
        detail: "3 s Pause unten",
        time: "2 Min",
        sec: 120,
        muscle: "Quads / Glutes",
        howto: "Leichte KH vor Brust. Tiefe Kniebeuge, 3 s unten halten. 6–8 Wdh.",
      },
      {
        name: "Sprunggelenk-Mobilisation",
        detail: "Knee-over-toe",
        time: "1 Min",
        sec: 60,
        muscle: "Sprunggelenk",
        howto: "Fuß 10 cm von Wand. Knie zur Wand, Ferse bleibt am Boden. 10× je Seite.",
      },
      {
        name: "Glute Bridges",
        detail: "Squeeze oben",
        time: "2 Min",
        sec: 120,
        muscle: "Glutes",
        howto: "Rückenlage, Hüfte heben. Oben Glutes 2 s maximal anspannen. 15–20 Wdh.",
      },
    ],

    exercises: [
      {
        name: "LH Back Squat",
        detail: "Mittelweite Stellung",
        muscle: "Quads / Glutes",
        howto: "Stange auf Trapezius. Schulterbreit, Core anspannen, mindestens parallel. Brust hoch, explosiv aufstehen.",
      },
      {
        name: "Rumänisches Kreuzheben",
        detail: "KH, Stretch betonen",
        muscle: "Hamstrings / Glutes",
        howto: "KH vor Körper. Hip Hinge: Hüfte zurück, Knie minimal gebeugt. KH eng entlang bis Hamstring-Stretch. Rücken gerade!",
      },
      {
        name: "Bulgarian Split Squats",
        detail: "Fuß erhöht",
        muscle: "Quads / Balance",
        howto: "Hinterer Fuß auf Bank. KH seitlich. Senkrecht runter. Näher = Quad; weiter = Glute.",
      },
      {
        name: "Beinbeuger Maschine",
        detail: "Liegend oder sitzend",
        muscle: "Hamstrings",
        howto: "Volle ROM: ganz strecken, ganz beugen. 1 s Squeeze oben, 3 s exzentrisch.",
      },
      {
        name: "Wadenheben stehend",
        detail: "Maschine oder Stufe",
        muscle: "Waden",
        howto: "Fußballen auf Kante. Hoch (1 s), Fersen unter Niveau (Stretch). 2 s hoch, 1 s halten, 3 s runter.",
      },
      {
        name: "Kettlebell Swing",
        detail: "Hip Hinge, explosiv",
        muscle: "Post. Chain",
        howto: "KB zwischen Beinen, explosiver Hip Snap. Arme passiv, Kraft aus Hüfte. KB bis Brusthöhe.",
      },
    ],
  },

  // ══════════════════════════════════════
  //  TAG D — GANZKÖRPER
  // ══════════════════════════════════════
  {
    id: "D",
    label: "Tag D",
    focus: "Ganzkörper",
    rounds: 3,
    work: 45,
    pause: 30,
    roundPause: 90,
    warmupPause: 10,

    warmup: [
      {
        name: "Ruderergometer",
        detail: "20 SPM",
        time: "5 Min",
        sec: 300,
        muscle: "Cardio",
        howto: "20 Schläge/Min, gleichmäßig. Beine → Oberkörper → Arme.",
      },
      {
        name: "World's Greatest Stretch",
        detail: "Beide Seiten",
        time: "2 Min",
        sec: 120,
        muscle: "Ganzkörper",
        howto: "Ausfallschritt, Ellbogen zum vorderen Fuß, Arm zur Decke drehen. 5 s halten, 4× je Seite.",
      },
      {
        name: "Banded Pull-Aparts",
        detail: "Schulterblätter",
        time: "1 Min",
        sec: 60,
        muscle: "Oberer Rücken",
        howto: "Band auf Schulterhöhe auseinanderziehen. 15–20 Wdh.",
      },
      {
        name: "Bodyweight Squats",
        detail: "Tempo 3-1-1",
        time: "2 Min",
        sec: 120,
        muscle: "Beine",
        howto: "3 s runter, 1 s Pause unten, 1 s hoch. 8–10 Wdh.",
      },
      {
        name: "Arm Circles + Scap Push-Ups",
        detail: "Schultern",
        time: "2 Min",
        sec: 120,
        muscle: "Schultern",
        howto: "<strong>Arm Circles:</strong> Klein → groß (20 s je Richtung).<br><strong>Scap Push-Ups:</strong> Arme gestreckt, nur Schulterblätter. 10–12 Wdh.",
      },
      {
        name: "Dead Bug",
        detail: "Core aktivieren",
        time: "1 Min",
        sec: 60,
        muscle: "Core",
        howto: "Rückenlage, Arme hoch, Knie 90°. Gegengleich Arm/Bein strecken. Unterer Rücken fest am Boden!",
      },
      {
        name: "Ankle & Wrist Mobility",
        detail: "Kreise",
        time: "1 Min",
        sec: 60,
        muscle: "Gelenke",
        howto: "Fußgelenke + Handgelenke kreisen (10× je Richtung).",
      },
    ],

    exercises: [
      {
        name: "KH Thruster",
        detail: "Front Squat → Press",
        muscle: "Ganzkörper",
        howto: "KH auf Schulterhöhe. Tiefe Kniebeuge, explosiv → KH über Kopf. Fließend, kein Stopp.",
      },
      {
        name: "LH Bent-Over Row",
        detail: "Proniert, Brust raus",
        muscle: "Rücken",
        howto: "Schulterbreiter Obergriff, 45° vorgebeugt. Stange zum unteren Brustbein. Kein Schwung.",
      },
      {
        name: "Ausfallschritte mit KH",
        detail: "Walking / alternierend",
        muscle: "Beine",
        howto: "KH seitlich, großer Schritt. Hinteres Knie fast zum Boden. Oberkörper aufrecht.",
      },
      {
        name: "Push-Up → Renegade Row",
        detail: "Liegestütz + Row",
        muscle: "Brust/Rücken/Core",
        howto: "Auf zwei KH: Push-Up → Row links → Row rechts. Füße breit. <strong>Core verhindert Rotation.</strong>",
      },
      {
        name: "Kabelzug Holzhacker",
        detail: "Diagonal",
        muscle: "Core / Rotation",
        howto: "Seitlich zum Kabelzug. Griff beidhändig, diagonale Bewegung. Kraft aus Rumpfrotation. 8–10× je Seite.",
      },
      {
        name: "TRX Plank / Body Saw",
        detail: "Instabil",
        muscle: "Core",
        howto: "Füße in TRX, Unterarm-Stütz. <strong>Body Saw:</strong> Körper langsam vor/zurück. Kleine Bewegung, max. Spannung.",
      },
    ],
  },
];

// --- Hilfsfunktion: Workout → flache Stationsliste (wie in der HTML-App) ---

export interface FlatStation {
  name: string;
  howto: string;
  workSeconds: number;
  pauseSeconds: number;
  isWarmup: boolean;
  muscle: string;
  detail: string;
}

export function flattenWorkout(day: WorkoutDay): FlatStation[] {
  const stations: FlatStation[] = [];

  // Warmup-Stationen mit individuellen Zeiten
  day.warmup.forEach((w) => {
    stations.push({
      name: w.name,
      howto: w.howto,
      workSeconds: w.sec,
      pauseSeconds: day.warmupPause,
      isWarmup: true,
      muscle: w.muscle,
      detail: w.detail,
    });
  });

  // Kraft-Stationen × Runden (geflacht)
  for (let r = 0; r < day.rounds; r++) {
    day.exercises.forEach((e) => {
      stations.push({
        name: e.name,
        howto: e.howto,
        workSeconds: day.work,
        pauseSeconds: day.pause,
        isWarmup: false,
        muscle: e.muscle,
        detail: e.detail,
      });
    });
  }

  return stations;
}

// --- Statistik ---

export function getWorkoutStats(day: WorkoutDay) {
  const warmupDuration = day.warmup.reduce((sum, w) => sum + w.sec, 0)
    + (day.warmup.length - 1) * day.warmupPause;

  const strengthRoundDuration = day.exercises.length * day.work
    + (day.exercises.length - 1) * day.pause;

  const strengthTotal = day.rounds * strengthRoundDuration
    + (day.rounds - 1) * day.roundPause;

  return {
    warmupStations: day.warmup.length,
    strengthStations: day.exercises.length,
    totalStationsFlat: day.warmup.length + day.exercises.length * day.rounds,
    warmupDurationSec: warmupDuration,
    strengthDurationSec: strengthTotal,
    totalDurationSec: warmupDuration + strengthTotal,
  };
}
