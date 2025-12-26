import { NextResponse } from "next/server";

export const runtime = "edge";

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as IncomingMessage[];
    const skill = (body?.skill ?? "") as string;
    const level = (body?.level ?? "") as string;

    const systemPrompt = [
      "You are an AI Learning Assistant embedded in The Dev Pocket.",
      "Create structured, actionable guidance: learning plan, key topics, curated resources, and practice tasks.",
      "Adapt tone and depth to the user's level. Prefer free, reputable resources when possible.",
      skill ? `Primary skill focus: ${skill}.` : undefined,
      level ? `Learner level: ${level}.` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // In development, return a mock response to enable testing without a key
      if (process.env.NODE_ENV !== "production") {
        const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "a learning goal";
        const focus = skill ? ` (focus: ${skill})` : "";
        const lvl = level ? ` for ${level} level` : "";
        const mock = `Here is a short mock study plan${focus}${lvl} based on: "${lastUser}"\n\n- Week 1: Fundamentals and quick wins\n- Week 2: Core concepts with small projects\n- Week 3: Build a capstone and practice interview-style questions\n- Resources: Official docs, 1-2 curated courses, and 3 hands-on exercises.`;
        return NextResponse.json({ reply: mock });
      }
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY. See README for setup." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Upstream error: ${err}` },
        { status: 500 }
      );
    }

    const json = await response.json();
    const reply = json?.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}


