/**
 * Server-side Gemini API verification helper for Exercise photo uploads.
 * 
 * Rules:
 * - Uses process.env.GEMINI_API_KEY (server-side only, never exposed to client).
 * - Enforces a 5-second timeout via AbortController.
 * - On Gemini failure, invalid key, or timeout: gracefully falls back to verified=false (flagged) with isFallback=true,
 *   allowing the calling pipeline to award partial XP rather than throwing or blocking completion.
 */

export interface GeminiVerificationResult {
  success: boolean;
  verified: boolean;
  reason: string;
  confidence?: number;
  isFallback: boolean;
}

export async function verifyExercisePhoto(
  photoBase64: string,
  mimeType: string = "image/jpeg"
): Promise<GeminiVerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini Verification] GEMINI_API_KEY missing in environment. Using partial XP fallback.");
    return {
      success: false,
      verified: false,
      reason: "Gemini API key missing on server — flagged for partial XP",
      isFallback: true,
    };
  }

  // Clean base64 header if present (e.g. data:image/png;base64,...)
  const cleanBase64 = photoBase64.includes(",")
    ? photoBase64.split(",")[1]
    : photoBase64;

  const prompt = `Analyze this image strictly for proof of physical exercise or workout activity.
Strict evaluation rules:
- MUST show real physical exercise, active sports, gym equipment, workout space, running/jogging, pushups/situps/stretches, or genuine fitness activity.
- MUST REJECT random non-workout photos, landscapes, scenery, anime/cartoons, animals, food, screenshots, text, or inactive sitting poses.
Reply strictly with a JSON object with keys:
"is_exercise": boolean (true ONLY if it is genuine exercise/fitness/workout),
"confidence": number between 0 and 1,
"reason": clear one-sentence explanation of why it is or is not an exercise photo.
Do not output markdown code blocks or any other text outside raw JSON.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[Gemini Verification API Error] ${response.status}: ${errText}`);
      return {
        success: false,
        verified: false,
        reason: `Gemini API returned status ${response.status}`,
        isFallback: true,
      };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Parse clean JSON output
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        verified: false,
        reason: "Could not parse Gemini verification JSON response",
        isFallback: true,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const isExercise = Boolean(parsed.is_exercise);
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
    const reason = parsed.reason || (isExercise ? "Photo verified as exercise activity" : "Photo does not show exercise activity");

    return {
      success: true,
      verified: isExercise && confidence >= 0.5,
      reason,
      confidence,
      isFallback: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    const errorMessage = isAbort ? "Gemini API request timed out (12s)" : (err instanceof Error ? err.message : "Unknown Gemini API error");

    console.warn(`[Gemini Verification Fallback] ${errorMessage}`);

    return {
      success: false,
      verified: false,
      reason: `${errorMessage}`,
      isFallback: true,
    };
  }
}
