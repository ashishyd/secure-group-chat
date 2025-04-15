import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

/**
 * Handles POST requests to generate smart reply suggestions for a given message.
 *
 * @param {NextRequest} request - The incoming request object containing the message.
 * @returns {Promise<NextResponse>} - A JSON response containing smart reply suggestions or an error message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body to extract the message
    const { message } = await request.json();
    if (!message) {
      // Return a 400 response if the message is missing
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Construct a prompt as context for generating smart replies
    const prompt = `Provide three concise, context-aware smart reply suggestions to the following message: "${message}". Do not include any serial numbers, bullets, or numbering in your replies. Return each suggestion on a new line.`;

    // Retrieve the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return a 500 response if the API key is not configured
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 },
      );
    }

    // Specify the model to use for generating replies
    const modelName = "gpt-4";

    // Make a request to the OpenAI API to generate smart replies
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

    // Parse the response from the OpenAI API
    const openAiData = await openAiResponse.json();

    if (!openAiResponse.ok) {
      // Log the error and return a 500 response if the API request fails
      logError("OpenAI API error", openAiData);
      return NextResponse.json(
        { error: openAiData.error?.message || "OpenAI API error" },
        { status: 500 },
      );
    }

    // Extract the reply content from the API response
    const replyContent = openAiData.choices?.[0]?.message?.content;
    if (!replyContent) {
      // Log the error and return a 500 response if no reply content is returned
      logError("No reply content returned from OpenAI API", openAiData);
      return NextResponse.json(
        { error: "No reply suggestions returned" },
        { status: 500 },
      );
    }

    // Split the reply content into individual suggestions
    const suggestions = replyContent
      .split("\n")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // Limit the suggestions to a maximum of three
    const finalSuggestions = suggestions.slice(0, 3);

    // Return the suggestions as a JSON response
    return NextResponse.json(
      { suggestions: finalSuggestions },
      { status: 200 },
    );
  } catch (error) {
    // Log the error and return a 500 response for any unexpected errors
    logError("Smart Reply error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
