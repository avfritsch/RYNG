import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { focus, equipment, durationMinutes, rounds, notes } = await req.json();

    const systemPrompt = `Du bist ein erfahrener Physiotherapeut und Sportwissenschaftler, der Zirkeltraining-Pläne erstellt.

Erstelle einen Trainingsplan als JSON. Der Plan besteht aus:
- Warmup-Übungen (isWarmup: true) die auf die Kraft-Übungen abgestimmt sind
- Kraft-Übungen (isWarmup: false) mit sinnvoller Reihenfolge

Wichtige Regeln:
- Abwechslung zwischen Push/Pull/Beine innerhalb eines Zirkels
- Keine zwei Übungen hintereinander für dieselbe Muskelgruppe
- Warmup muss die Muskelgruppen des Kraftteils vorbereiten
- Warmup-Übungen: individuelle Dauer (30-120s), kurze Pausen (10s)
- Kraft-Übungen: einheitliche Dauer (30-45s), Pausen (20-30s)
- Übungsnamen auf Deutsch

Antworte NUR mit validem JSON in diesem Format:
{
  "name": "Planname",
  "description": "Kurze Beschreibung",
  "stations": [
    {
      "name": "Übungsname",
      "workSeconds": 45,
      "pauseSeconds": 30,
      "isWarmup": false,
      "howto": "Ausführungsbeschreibung in 1-2 Sätzen"
    }
  ],
  "rounds": 3,
  "roundPause": 90
}`;

    const userPrompt = [
      `Erstelle einen Zirkeltraining-Plan mit folgenden Vorgaben:`,
      focus ? `Fokus: ${focus}` : null,
      equipment?.length ? `Verfügbares Equipment: ${equipment.join(", ")}` : `Equipment: nur Bodyweight`,
      durationMinutes ? `Gewünschte Dauer: ca. ${durationMinutes} Minuten` : null,
      rounds ? `Runden: ${rounds}` : null,
      notes ? `Zusätzliche Wünsche: ${notes}` : null,
    ].filter(Boolean).join("\n");

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not parse plan from AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const plan = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(plan),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
