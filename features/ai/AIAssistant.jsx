// features/ai/AIAssistant.jsx
import React, { useState } from "react";

const PROMPTS = [
  "Analyze player weaknesses from last 5 matches",
  "Suggest best rotation against opponent",
  "Generate technical training for serve reception",
  "Recommend tactical adjustments for tomorrow's match",
];

export default function AIAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "ai", text: "⏳ AI analysis coming soon — connect your OpenAI / Gemini API key in Settings." },
    ]);
    setInput("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Coach Assistant</h1>
        <p className="text-gray-400 text-sm mt-0.5">AI-powered volleyball analysis and coaching recommendations</p>
      </div>

      <div className="card space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Quick prompts</p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => setInput(p)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors">
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="card min-h-64 max-h-96 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-5xl mb-3">🤖</div>
            <p className="text-gray-400 text-sm">Ask XURA AI anything about your team or match strategy.</p>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-sm px-4 py-2 rounded-2xl text-sm ${
              m.role === "user" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-200"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the AI coach…"
          className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 transition-colors" />
        <button onClick={send} className="btn-primary px-5">Send</button>
      </div>
    </div>
  );
}
