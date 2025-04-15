// src/app/api/smart-reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Construct a prompt as context for smart replies.
    const prompt = `Provide three concise, context-aware smart reply suggestions to the following message: "${message}". Do not include any serial numbers, bullets, or numbering in your replies. Return each suggestion on a new line.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 },
      );
    }

    // Use GPT-4 (or gpt-4.1 if available).
    const modelName = "gpt-4";

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that provides smart, concise reply suggestions for chat messages.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 60,
          temperature: 0.7,
        }),
      },
    );

    const openAiData = await openAiResponse.json();

    if (!openAiResponse.ok) {
      logError("OpenAI API error", openAiData);
      return NextResponse.json(
        { error: openAiData.error?.message || "OpenAI API error" },
        { status: 500 },
      );
    }

    const replyContent = openAiData.choices?.[0]?.message?.content;
    if (!replyContent) {
      logError("No reply content returned from OpenAI API", openAiData);
      return NextResponse.json(
        { error: "No reply suggestions returned" },
        { status: 500 },
      );
    }

    // Split the reply content into suggestions, assuming each suggestion is on a new line.
    const suggestions = replyContent
      .split("\n")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const finalSuggestions = suggestions.slice(0, 3);

    return NextResponse.json(
      { suggestions: finalSuggestions },
      { status: 200 },
    );
  } catch (error) {
    logError("Smart Reply error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
