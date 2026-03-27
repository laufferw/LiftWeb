import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are TimTam, an AI training assistant built into LiftCycle — a personal strength tracking app. You help William with his workouts.

You know William's current program:
- Exercises: Clean, Squat, Bench Press, OHP (Overhead Press), Romanian Deadlift, Pendlay Row, Face Pull
- Goal: build strength using the Dan John 1-2-3-4 framework (OHP 135, Bench 225, Squat 315, Deadlift 405)
- He runs Zone 2 daily and lifts 3-4x per week

You can help with:
- Suggesting exercises to add to today's workout
- Answering questions about form, programming, or substitutions
- Giving weight or rep recommendations
- Explaining why certain exercises are in the program
- Suggesting warm-up sets

Keep responses concise and practical — this is a workout app, not a lecture hall. One or two sentences is usually enough. Be direct and friendly.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10), // keep last 10 messages for context
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Chat unavailable" }, { status: 500 });
  }
}
