import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { image } = await req.json() as { image: string };

    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a food identification assistant for a fitness app called Loop Fit. Analyze the food photo and return a JSON object with this exact structure:
{
  "components": [
    {
      "foodName": string,
      "cuisine": string,
      "category": string (Breakfast/Lunch/Dinner/Snacks),
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
- Return ONLY the JSON object, no markdown or extra text.`,
          },
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
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
