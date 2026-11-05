import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CoachMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: CoachMessage[];
  profile: {
    name?: string;
    age?: number | string;
    sex?: string;
    weight?: number | string;
    height?: number | string;
    primary_goal?: string;
    activity_level?: string;
    workout_experience?: string;
    workout_location?: string;
    diet?: string;
    motivation?: string;
  };
  nutrition: {
    calorieTarget: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre: number;
    waterGoalMl: number;
    isMinor: boolean;
    warning: string | null;
    micronutrients: {
      calcium: number; iron: number; zinc: number; magnesium: number;
      potassium: number; sodium: number; vitaminA: number; vitaminC: number;
      vitaminD: number; vitaminB12: number; folate: number;
    };
  };
  todayCalories: number;
  todayWaterMl: number;
  streakDays: number;
}

function buildSystemPrompt(body: RequestBody): string {
  const p = body.profile;
  const n = body.nutrition;
  const micro = n.micronutrients;

  return `You are Loop Fit Coach, a friendly fitness and nutrition assistant for the Loop Fit app. You provide educational guidance, not medical advice. Always recommend consulting a qualified healthcare professional for health concerns.

USER PROFILE:
- Name: ${p.name || "Unknown"}
- Age: ${p.age || "Unknown"}
- Sex: ${p.sex || "Not specified"}
- Weight: ${p.weight || "?"} kg
- Height: ${p.height || "?"} cm
- Goal: ${p.primary_goal || "general health"}
- Activity level: ${p.activity_level || "light"}
- Workout experience: ${p.workout_experience || "beginner"}
- Workout location: ${p.workout_location || "both"}
- Diet: ${p.diet || "not specified"}
- Motivation: ${p.motivation || "not specified"}

NUTRITION TARGETS (daily):
- Calories: ${n.calorieTarget} kcal
- Protein: ${n.protein}g
- Carbs: ${n.carbs}g
- Fat: ${n.fat}g
- Fibre: ${n.fibre}g
- Water: ${(n.waterGoalMl / 1000).toFixed(1)}L
- Calcium: ${micro.calcium}mg
- Iron: ${micro.iron}mg
- Zinc: ${micro.zinc}mg
- Magnesium: ${micro.magnesium}mg
- Potassium: ${micro.potassium}mg
- Vitamin A: ${micro.vitaminA}mcg
- Vitamin C: ${micro.vitaminC}mg
- Vitamin D: ${micro.vitaminD}mcg
- Vitamin B12: ${micro.vitaminB12}mcg
- Folate: ${micro.folate}mcg

TODAY'S PROGRESS:
- Calories consumed: ${Math.round(body.todayCalories)} kcal
- Water consumed: ${(body.todayWaterMl / 1000).toFixed(1)}L
- Streak: ${body.streakDays} days

${n.isMinor ? "IMPORTANT: This user is under 18. Do NOT recommend calorie deficits or restrictive eating. Focus on healthy growth, balanced nutrition, and age-appropriate activity. Always advise consulting a healthcare professional." : ""}

${n.warning ? "NOTE: " + n.warning : ""}

GUIDELINES:
- Use the nutrition targets above when discussing calories, protein, or macros.
- Suggest real foods: milk, curd, paneer, dal, chickpeas, beans, eggs, fish, chicken, soy, nuts, lentils, spinach, ragi, etc.
- Keep responses concise (2-4 sentences unless asked for detail).
- Do not recommend protein supplements unless specifically asked.
- Do not provide medical diagnoses.
- For health concerns, advise consulting a qualified healthcare professional.
- Use encouraging, friendly language.`;
}

async function callAI(messages: CoachMessage[], retries = 1): Promise<string> {
  const apiKey = Deno.env.get("PRIMARY_AI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
  const provider = Deno.env.get("PRIMARY_AI_PROVIDER") || "openai";
  const model = Deno.env.get("PRIMARY_AI_MODEL") || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("No AI API key configured");
  }

  let url: string;
  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
  } else {
    url = "https://api.openai.com/v1/chat/completions";
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let response: Response;
      if (provider === "anthropic") {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 600,
            messages: messages.filter((m) => m.role !== "system").map((m) => ({
              role: m.role,
              content: m.content,
            })),
            system: messages.find((m) => m.role === "system")?.content || "",
          }),
        });
      } else {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 600,
            messages,
            temperature: 0.7,
          }),
        });
      }

      if (response.status === 429) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error("Rate limited. Please try again in a moment.");
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      if (provider === "anthropic") {
        return data.content?.[0]?.text || "I could not generate a response.";
      }
      return data.choices?.[0]?.message?.content || "I could not generate a response.";
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("AI API failed after retries");
}

async function callFallbackAI(messages: CoachMessage[]): Promise<string> {
  const fallbackKey = Deno.env.get("FALLBACK_AI_API_KEY");
  if (!fallbackKey) throw new Error("No fallback AI key");

  const provider = Deno.env.get("FALLBACK_AI_PROVIDER") || "openai";
  const model = Deno.env.get("FALLBACK_AI_MODEL") || "gpt-4o-mini";

  let url: string;
  if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
  } else {
    url = "https://api.openai.com/v1/chat/completions";
  }

  if (provider === "anthropic") {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": fallbackKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: messages.filter((m) => m.role !== "system").map((m) => ({
          role: m.role,
          content: m.content,
        })),
        system: messages.find((m) => m.role === "system")?.content || "",
      }),
    });
    if (!response.ok) throw new Error(`Fallback API error (${response.status})`);
    const data = await response.json();
    return data.content?.[0]?.text || "I could not generate a response.";
  } else {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fallbackKey}`,
      },
      body: JSON.stringify({ model, max_tokens: 600, messages, temperature: 0.7 }),
    });
    if (!response.ok) throw new Error(`Fallback API error (${response.status})`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I could not generate a response.";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = buildSystemPrompt(body);
    const fullMessages: CoachMessage[] = [
      { role: "system", content: systemPrompt },
      ...body.messages.slice(-10),
    ];

    let aiResponse: string;
    try {
      aiResponse = await callAI(fullMessages, 1);
    } catch (primaryErr) {
      console.error("Primary AI failed:", primaryErr.message);
      try {
        aiResponse = await callFallbackAI(fullMessages);
      } catch (fallbackErr) {
        console.error("Fallback AI failed:", fallbackErr.message);
        return new Response(
          JSON.stringify({
            error: "AI service is temporarily unavailable. Please try again.",
            fallback: true,
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ text: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
