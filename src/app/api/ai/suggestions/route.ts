import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SuggestionContext = "wishlist" | "registry" | "browse";

interface SuggestionRequest {
  kid_id?: string;
  context: SuggestionContext;
  existing_items?: string[];
  age?: number;
  interests?: string[];
  limit?: number;
}

interface GiftSuggestion {
  title: string;
  description: string;
  estimated_price: string;
  category: string;
  search_query: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SuggestionRequest;
    const { kid_id, context, existing_items = [], age, interests = [], limit = 5 } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get cached suggestions first
    if (kid_id) {
      const { data: cached } = await supabase
        .from("ai_suggestion_cache")
        .select("*")
        .eq("kid_id", kid_id)
        .eq("context", context)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cached) {
        return NextResponse.json({ suggestions: cached.suggestions });
      }
    }

    // Get kid info for better suggestions
    let kidAge = age;
    let kidInterests = interests;
    let kidDislikes: string[] = [];
    let kidAllergies: string[] = [];

    if (kid_id) {
      const { data: kid } = await supabase
        .from("kids")
        .select("*, kid_preferences")
        .eq("id", kid_id)
        .single();

      if (kid) {
        if (kid.birthdate) {
          const birth = new Date(kid.birthdate);
          const today = new Date();
          kidAge = today.getFullYear() - birth.getFullYear();
        }

        if (kid.kid_preferences) {
          kidInterests = kid.kid_preferences.interests || [];
          kidDislikes = kid.kid_preferences.dislikes || [];
          kidAllergies = kid.kid_preferences.allergies || [];
        }
      }
    }

    // Build the prompt
    const prompt = buildPrompt({
      age: kidAge,
      interests: kidInterests,
      dislikes: kidDislikes,
      allergies: kidAllergies,
      existingItems: existing_items,
      context,
      limit,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful gift recommendation assistant for The Giddy List, a platform that helps parents create wishlists and gift guides for their kids.

You provide thoughtful, age-appropriate gift suggestions based on the child's age, interests, and preferences.

Always return suggestions in valid JSON format as an array of objects with these fields:
- title: Product name (be specific but not brand-specific)
- description: Brief 1-2 sentence description of why this is a good gift
- estimated_price: Price range like "$20-30" or "$50+"
- category: One of: toys, books, clothing, gear, outdoor, arts-crafts, electronics, sports, room-decor, other
- search_query: A good search term to find this product online

Never suggest anything inappropriate, dangerous, or unsuitable for the age group.
Avoid items that contain common allergens if allergies are mentioned.
Focus on quality, educational value, and fun factor.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";

    // Parse the JSON response
    let suggestions: GiftSuggestion[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return fallback suggestions
      suggestions = getFallbackSuggestions(kidAge, context);
    }

    // Cache the suggestions
    if (kid_id && suggestions.length > 0) {
      await supabase.from("ai_suggestion_cache").upsert({
        kid_id,
        context,
        suggestions,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      }, {
        onConflict: "kid_id,context",
      });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggestions error:", error);

    // Return fallback suggestions on error
    const fallback = getFallbackSuggestions(undefined, "wishlist");
    return NextResponse.json({ suggestions: fallback });
  }
}

function buildPrompt(params: {
  age?: number;
  interests: string[];
  dislikes: string[];
  allergies: string[];
  existingItems: string[];
  context: SuggestionContext;
  limit: number;
}): string {
  const { age, interests, dislikes, allergies, existingItems, context, limit } = params;

  let prompt = `Please suggest ${limit} gift ideas`;

  if (age) {
    prompt += ` for a ${age} year old child`;
  }

  if (interests.length > 0) {
    prompt += `. They're interested in: ${interests.join(", ")}`;
  }

  if (dislikes.length > 0) {
    prompt += `. Please avoid anything related to: ${dislikes.join(", ")}`;
  }

  if (allergies.length > 0) {
    prompt += `. Important - they have these allergies/sensitivities: ${allergies.join(", ")}`;
  }

  if (existingItems.length > 0) {
    prompt += `. They already have these items on their list, so suggest different things: ${existingItems.slice(0, 10).join(", ")}`;
  }

  switch (context) {
    case "wishlist":
      prompt += `. These are for a personal wishlist - suggest a mix of fun and practical items.`;
      break;
    case "registry":
      prompt += `. These are for a gift registry event - focus on gifts that family and friends would want to give.`;
      break;
    case "browse":
      prompt += `. These are popular gift ideas - focus on trending and highly-rated items.`;
      break;
  }

  prompt += ` Return the suggestions as a JSON array.`;

  return prompt;
}

function getFallbackSuggestions(age?: number, context?: SuggestionContext): GiftSuggestion[] {
  // Age-appropriate fallback suggestions
  const suggestions: GiftSuggestion[] = [];

  if (!age || age <= 2) {
    suggestions.push(
      { title: "Wooden Stacking Blocks", description: "Develops motor skills and spatial awareness through play", estimated_price: "$20-30", category: "toys", search_query: "wooden stacking blocks toddler" },
      { title: "Board Books Set", description: "Durable books perfect for little hands and early reading", estimated_price: "$15-25", category: "books", search_query: "board books toddler set" },
      { title: "Musical Instrument Set", description: "Encourages creativity and rhythm through simple instruments", estimated_price: "$25-40", category: "toys", search_query: "toddler musical instruments set" }
    );
  } else if (age <= 5) {
    suggestions.push(
      { title: "LEGO Duplo Set", description: "Large building blocks perfect for developing creativity and fine motor skills", estimated_price: "$30-50", category: "toys", search_query: "lego duplo building set" },
      { title: "Art Supply Kit", description: "Everything they need to create their masterpieces", estimated_price: "$20-35", category: "arts-crafts", search_query: "kids art supplies kit preschool" },
      { title: "Outdoor Play Tent", description: "Perfect for imaginative play indoors or outdoors", estimated_price: "$30-50", category: "outdoor", search_query: "kids play tent outdoor" }
    );
  } else if (age <= 8) {
    suggestions.push(
      { title: "LEGO Classic Set", description: "Endless building possibilities for creative minds", estimated_price: "$30-60", category: "toys", search_query: "lego classic creative brick set" },
      { title: "Chapter Book Series", description: "Age-appropriate adventure stories to encourage reading", estimated_price: "$20-40", category: "books", search_query: "kids chapter books series age 6-8" },
      { title: "Science Experiment Kit", description: "Hands-on learning with safe, fun experiments", estimated_price: "$25-45", category: "toys", search_query: "kids science experiment kit" }
    );
  } else if (age <= 12) {
    suggestions.push(
      { title: "STEM Building Kit", description: "Challenging building projects that teach engineering concepts", estimated_price: "$40-70", category: "toys", search_query: "stem building kit kids 9-12" },
      { title: "Art Sketch Set", description: "Professional-quality supplies for budding artists", estimated_price: "$30-50", category: "arts-crafts", search_query: "kids sketch art set professional" },
      { title: "Sports Equipment", description: "Quality gear for their favorite sport", estimated_price: "$30-60", category: "sports", search_query: "kids sports equipment set" }
    );
  } else {
    suggestions.push(
      { title: "Tech Gadget", description: "Age-appropriate technology for learning and entertainment", estimated_price: "$50-100", category: "electronics", search_query: "teen tech gadget educational" },
      { title: "Room Decor Set", description: "Let them personalize their space", estimated_price: "$25-50", category: "room-decor", search_query: "teen room decor set" },
      { title: "Hobby Kit", description: "Everything they need to pursue their interests", estimated_price: "$30-60", category: "other", search_query: "teen hobby starter kit" }
    );
  }

  return suggestions.slice(0, 5);
}
