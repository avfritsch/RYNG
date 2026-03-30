import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

Deno.serve(async (req) => {
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

    const { focus, equipment, durationMinutes, rounds, notes, exercises } = await req.json();

    // Build exercise catalog for Claude
    const exerciseCatalog = (exercises ?? []).map((ex: { name: string; category: string; muscle_groups: string[]; equipment: string[]; howto: string }) =>
      `- ${ex.name} [${ex.category}] Muskeln: ${ex.muscle_groups?.join(', ') || '?'} | Equipment: ${ex.equipment?.join(', ') || 'Bodyweight'}`
    ).join('\n');

    const systemPrompt = `Du bist ein erfahrener Sportwissenschaftler, der Zirkeltraining-Pläne zusammenstellt.

Du hast folgende Übungsbibliothek zur Verfügung. Wähle NUR Übungen aus dieser Liste — erfinde KEINE eigenen Übungen:

${exerciseCatalog}

Regeln:
- Wähle passende Warmup-Übungen (Kategorie "warmup" oder "stretch") und Kraft-Übungen
- Abwechslung zwischen Muskelgruppen im Zirkel
- Keine zwei Übungen hintereinander für dieselbe Muskelgruppe
- Warmup bereitet die Muskelgruppen des Kraftteils vor
- Warmup: individuelle Dauer (30-120s), Pausen 10s
- Kraft: einheitliche Dauer (30-45s), Pausen (20-30s)
- Verwende die Übungsnamen EXAKT wie in der Bibliothek

Antworte NUR mit validem JSON:
{
  "name": "Planname",
  "description": "Kurze Beschreibung",
  "stations": [
    {
      "name": "EXAKTER Übungsname aus der Bibliothek",
      "workSeconds": 45,
      "pauseSeconds": 30,
      "isWarmup": false
    }
  ],
  "rounds": 3,
  "roundPause": 90
}`;

    const userPrompt = [
      `Stelle einen Zirkeltraining-Plan zusammen:`,
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
