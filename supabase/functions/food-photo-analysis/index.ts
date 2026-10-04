import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Provider configuration ───────────────────────────────────────────────
// The primary provider is tried first. If it returns a transient error
// (429 / 502 / 503 / 504 / network) we retry with exponential backoff.
// After MAX_RETRIES we fall back to the fallback provider (same retry logic).
// Providers are selected via env vars so they can be swapped without code changes.

type ProviderConfig = {
  name: string;
  apiKey: string;
  model: string;
  endpoint: string;
};

function getProviders(): { primary: ProviderConfig | null; fallback: ProviderConfig | null } {
  const primaryKey = Deno.env.get("PRIMARY_AI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
  const fallbackKey = Deno.env.get("FALLBACK_AI_API_KEY");

  const primary: ProviderConfig | null = primaryKey
    ? {
        name: Deno.env.get("PRIMARY_AI_PROVIDER") || "openai",
        apiKey: primaryKey,
        model: Deno.env.get("PRIMARY_AI_MODEL") || "gpt-4o-mini",
        endpoint: "https://api.openai.com/v1/chat/completions",
      }
    : null;

  const fallback: ProviderConfig | null = fallbackKey
    ? {
        name: Deno.env.get("FALLBACK_AI_PROVIDER") || "openai",
        apiKey: fallbackKey,
        model: Deno.env.get("FALLBACK_AI_MODEL") || "gpt-4o-mini",
        endpoint: "https://api.openai.com/v1/chat/completions",
      }
    : null;

  return { primary, fallback };
}

// ─── Retry logic ───────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 30_000;

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

type ProviderError = {
  status: number;
  message: string;
  retryAfterMs: number | null;
};

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds * 1000;
  const date = new Date(headerValue).getTime();
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

function isRetryable(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── AI call ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a food identification assistant for a fitness app called Loop Fit. Analyze the food photo and return a JSON object with this exact structure:
{
  "components": [
    {
      "foodName": string,
      "cuisine": string,
      "category": string (Breakfast/Lunch/Dinner/Snack),
      "quantity": number,
      "servingUnit": string (pieces/cups/ml/grams/slices/scoops/tablespoons),
      "size": string (Small/Medium/Large or empty if not applicable),
      "cookingMethod": string (e.g. Fried, Grilled, Steamed, Baked, Boiled, Raw),
      "oilLevel": string (Low/Medium/High),
      "sugarLevel": string (Low/Medium/High/None),
      "estimatedCalories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams)
    }
  ],
  "totalEstimatedCalories": number,
  "confidence": string (High/Medium/Low),
  "notes": string
}
Rules:
- Identify each visible food component separately for mixed meals.
- Calories are APPROXIMATE estimates, not exact.
- Use the correct serving unit: chapati=pieces, idli=pieces, dosa=pieces, rice=cups/grams, milk=ml, oats=grams, pizza=slices, bread=slices, egg=pieces, banana=pieces.
- Small/Medium/Large must affect calorie estimates differently.
- If you cannot confidently identify the food, set confidence to "Low" and provide possible matches in notes.
- Do NOT invent food names. If uncertain, say so.
- Return ONLY the JSON object, no markdown or extra text.`;

async function callProvider(
  provider: ProviderConfig,
  image: string,
): Promise<{ ok: true; data: Record<string, unknown> } | ProviderError> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food photo and estimate the nutritional content." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let detail = "";
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        detail = parsed.error?.message || "";
      } catch {
        detail = errText.slice(0, 200);
      }
      // Log server-side without exposing to client
      console.error(`[${provider.name}] HTTP ${response.status}: ${detail}`);
      return {
        status: response.status,
        message: detail || `Provider returned ${response.status}`,
        retryAfterMs: parseRetryAfter(response.headers.get("Retry-After")),
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      console.error(`[${provider.name}] Failed to parse AI response`);
      return { status: 502, message: "Unparseable AI response", retryAfterMs: null };
    }

    return { ok: true, data: parsed };
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Network error";
    // AbortController timeout → treat as 504 (retryable)
    const status = err instanceof Error && err.name === "AbortError" ? 504 : 503;
    console.error(`[${provider.name}] Network/timeout: ${message}`);
    return { status, message, retryAfterMs: null };
  }
}

// ─── Call with retry ───────────────────────────────────────────────────────

async function callWithRetry(
  provider: ProviderConfig,
  image: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { error: ProviderError }> {
  let lastError: ProviderError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await callProvider(provider, image);

    if ("ok" in result) {
      return result;
    }

    lastError = result;

    // Non-retryable → stop immediately (400, 401, 403, 500, etc.)
    if (!isRetryable(result.status)) {
      return { error: result };
    }

    // Retryable but we've exhausted retries
    if (attempt >= MAX_RETRIES) {
      return { error: result };
    }

    // Calculate delay: respect Retry-After if present, otherwise exponential backoff
    const delay = result.retryAfterMs ?? BASE_DELAY_MS * Math.pow(2, attempt);
    const cappedDelay = Math.min(delay, 60_000); // cap at 60s

    console.log(
      `[${provider.name}] Retryable error ${result.status}, retry ${attempt + 1}/${MAX_RETRIES} in ${cappedDelay}ms`,
    );

    await sleep(cappedDelay);
  }

  return { error: lastError ?? { status: 503, message: "Max retries exceeded", retryAfterMs: null } };
}

// ─── Map provider error to user-safe HTTP response ─────────────────────────

function userSafeError(status: number): { httpStatus: number; message: string } {
  switch (status) {
    case 400:
      return { httpStatus: 400, message: "The image could not be processed. Please try a different photo." };
    case 401:
    case 403:
      return { httpStatus: 503, message: "Food analysis is temporarily unavailable. Please try again in a moment." };
    case 429:
      return { httpStatus: 429, message: "AI service is temporarily busy. Please try again in a moment." };
    case 502:
      return { httpStatus: 502, message: "Food analysis is temporarily unavailable. Please try again in a moment." };
    case 503:
      return { httpStatus: 503, message: "Food analysis is temporarily unavailable. Please try again in a moment." };
    case 504:
      return { httpStatus: 504, message: "Food analysis timed out. Please try again in a moment." };
    default:
      return { httpStatus: 502, message: "Food analysis is temporarily unavailable. Please try again in a moment." };
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as { image?: string };

    const image = body.image;
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic image validation
    if (!image.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image format. Please send a valid photo." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reasonable size limit (~10MB base64)
    if (image.length > 14_000_000) {
      return new Response(JSON.stringify({ error: "Image is too large. Please use a smaller photo." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { primary, fallback } = getProviders();

    if (!primary && !fallback) {
      console.error("No AI provider keys configured (PRIMARY_AI_API_KEY / FALLBACK_AI_API_KEY)");
      return new Response(
        JSON.stringify({ error: "Food analysis is temporarily unavailable. Please try again in a moment." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Try primary provider ──
    if (primary) {
      const result = await callWithRetry(primary, image);
      if ("ok" in result) {
        return new Response(JSON.stringify(result.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error(`[primary] All retries exhausted: ${result.error.status}`);

      // If no fallback, return user-safe error
      if (!fallback) {
        const safe = userSafeError(result.error.status);
        return new Response(JSON.stringify({ error: safe.message }), {
          status: safe.httpStatus,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Fall back to fallback provider ──
      console.log("[fallback] Attempting fallback provider...");
      const fallbackResult = await callWithRetry(fallback, image);
      if ("ok" in fallbackResult) {
        return new Response(JSON.stringify(fallbackResult.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error(`[fallback] All retries exhausted: ${fallbackResult.error.status}`);
      const safe = userSafeError(fallbackResult.error.status);
      return new Response(JSON.stringify({ error: safe.message }), {
        status: safe.httpStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── No primary, try fallback directly ──
    if (fallback) {
      const result = await callWithRetry(fallback, image);
      if ("ok" in result) {
        return new Response(JSON.stringify(result.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const safe = userSafeError(result.error.status);
      return new Response(JSON.stringify({ error: safe.message }), {
        status: safe.httpStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Food analysis is temporarily unavailable. Please try again in a moment." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`[handler] ${message}`);
    return new Response(
      JSON.stringify({ error: "Food analysis is temporarily unavailable. Please try again in a moment." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
