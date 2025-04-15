import { POST } from "@/app/api/smart-reply/route";
import { NextRequest } from "next/server";
import { logError } from "@/lib/logger";

jest.mock("@/lib/logger");

describe("POST handler for smart reply", () => {
  it("returns 400 if message is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Message is required" });
  });

  it("returns 500 if OpenAI API key is not configured", async () => {
    process.env.OPENAI_API_KEY = "";

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ message: "Hello" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "OpenAI API key is not configured" });
  });

  it("returns 500 if OpenAI API request fails", async () => {
    process.env.OPENAI_API_KEY = "mock-api-key";

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: { message: "API error" } }),
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ message: "Hello" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "API error" });
    expect(logError).toHaveBeenCalledWith("OpenAI API error", {
      error: { message: "API error" },
    });
  });

  it("returns 500 if no reply content is returned from OpenAI API", async () => {
    process.env.OPENAI_API_KEY = "mock-api-key";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ choices: [] }),
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ message: "Hello" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "No reply suggestions returned" });
    expect(logError).toHaveBeenCalledWith(
      "No reply content returned from OpenAI API",
      { choices: [] },
    );
  });

  it("returns 200 with smart reply suggestions", async () => {
    process.env.OPENAI_API_KEY = "mock-api-key";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: "Sure\nNo problem\nLet me check",
            },
          },
        ],
      }),
    });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ message: "Hello" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      suggestions: ["Sure", "No problem", "Let me check"],
    });
  });
});
