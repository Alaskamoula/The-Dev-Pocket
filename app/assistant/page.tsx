"use client";

import { useState } from "react";
import skills from "@/app/data/skills.json";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function LearningAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content:
      "Hi! I\'m your AI Learning Assistant. Tell me your goal (e.g., \"learn React for a job-ready project\") and I\'ll craft a plan, resources, and practice tasks.",
  }]);
  const [input, setInput] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [level, setLevel] = useState<string>("beginner");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: input.trim() },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-6),
          skill: selectedSkill,
          level,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to get response");
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry, I couldn\'t reach the learning engine. Please verify the server and your API key.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">AI Learning Assistant</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Get personalized study plans, curated resources, and coding exercises for any skill.
      </p>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Skill focus</label>
          <select
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
          >
            <option value="">Any</option>
            {skills.map((s: { id: string; name: string }) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-[420px] overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  "inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm " +
                  (m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-left">
              <div className="inline-block rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2">
          <input
            type="text"
            placeholder="Describe your learning goal or ask a question..."
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}


