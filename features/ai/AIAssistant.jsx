// features/ai/AIAssistant.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AIAssistant() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [analysisType, setAnalysisType] = useState("tactical");

  const PROMPTS = isAR ? [
    "تحليل نمط التوزيع للهجوم للخصم في حالة الاستقبال المثالي (+)",
    "اقتراح تشكيل دوران (Matchup) ضد اقوى مهاجم للخصم في مركز 4",
    "تحليل نقاط ضعف حائط الصد الخاص بنا من المركز 3",
    "توصيات الإرسال التكتيكي ضد ليبرو الخصم"
  ] : [
    "Analyze opponent setter distribution on perfect pass (+)",
    "Suggest rotational matchup against their strongest OH in zone 4",
    "Analyze our middle block weaknesses in Transition",
    "Tactical serve recommendations targeting opponent Libero"
  ];

  const MOCK_AI_RESPONSE = isAR ? `
**تحليل تكتيكي عميق (نموذج محاكاة Data Volley 4):**

بناءً على تحليل آخر 300 حدث רصد:
1. **توزيع الإعداد (Setter Distribution):** 
عندما يكون الاستقبال إيجابياً (R# أو R+)، يقوم المعد بتوزيع الكرات كالتالي:
- 45% للمركز 4 (هجوم سريع)
- 35% للمركز 3 (كرات قصيرة/Quick)
- 20% للمركز 2 أو الهجوم الخلفي (Pipe)

2. **الضعف الدفاعي للخصم:**
- تم تسجيل كفاءة هجومنا بنسبة 62% عند الهجوم من المركز 2 (Zone 2) في حالة الدوران P1 للخصم.

**توصية المدرب العالمي (Head Coach Action Plan):**
- **الإرسال:** وجه الإرسال القصير (Short Serve) إلى المنطقة 2-3 لإجبار المعد على الحركة وتدمير الهجوم السريع من المنتصف.
- **حائط الصد:** اعتمد على خطة (Commit Block) مع المهاجم الأوسط في حالة الدوران P1 و P6 للخصم.
` : `
**Deep Tactical Analysis (Data Volley 4 Engine Simulation):**

Based on the latest 300 scouting events:
1. **Setter Distribution (Perfect Pass +/#):**
- 45% to Zone 4 (Fast Tempo)
- 35% to Zone 3 (Quick/Meter)
- 20% to Zone 2 or Backrow (Pipe)

2. **Opponent Defensive Flaws:**
- Our attack efficiency peaks at 62% when attacking from Zone 2 while the opponent is in rotation P1.

**Head Coach Action Plan:**
- **Service Strategy:** Implement short tactical serves to zones 2-3 to force the setter out of system and neutralize their middle attack.
- **Blocking Scheme:** Use a Commit Block strategy on their Middle Blocker specifically during their P1 and P6 rotations.
`;

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: MOCK_AI_RESPONSE }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Left Sidebar: Settings */}
      <div className="w-full lg:w-80 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-red-500">🤖</span> {t("ai_title")}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{isAR ? "مدير فني عالمي ومحلل أداء متقدم" : "World-Class Head Coach & Tactical Analyst"}</p>
        </div>

        <div className="card space-y-4 border-t-4 border-t-red-600">
          <h3 className="font-bold text-white text-sm uppercase">{isAR ? "محرك التحليل" : "Analysis Engine"}</h3>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "نوع التحليل" : "Analysis Type"}</label>
            <select value={analysisType} onChange={e => setAnalysisType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-red-500">
              <option value="tactical">{isAR ? "تكتيك وخطط لعب (Tactical)" : "Tactical Gameplan"}</option>
              <option value="technical">{isAR ? "تحليل فني فردي (Technical)" : "Individual Technical"}</option>
              <option value="physical">{isAR ? "حمل بدني (Physical Load)" : "Physical Load"}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "البيانات المصدرية" : "Source Data"}</label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-red-500">
              <option>Data Volley Events (All Season)</option>
              <option>Last 3 Matches</option>
              <option>Specific Match</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "مستوى عمق الذكاء" : "AI Depth Level"}</label>
            <input type="range" min="1" max="10" defaultValue="8" className="w-full accent-red-500" />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>{isAR ? "موجز" : "Summary"}</span>
              <span>{isAR ? "تحليل دقيق DV4" : "Deep DV4 Analysis"}</span>
            </div>
          </div>
        </div>

        <div className="card space-y-2">
          <p className="text-xs text-gray-400 font-bold mb-2">{isAR ? "مقترحات المدرب" : "Coach Suggestions"}</p>
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => setInput(p)}
              className="w-full text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2 rounded transition-colors leading-relaxed">
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Right Side: Chat / Output */}
      <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl h-[calc(100vh-120px)]">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-5xl mb-4 border-4 border-gray-700 shadow-inner">
                🧠
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{isAR ? "محرك XURA التحليلي جاهز" : "XURA Analytical Engine Ready"}</h2>
              <p className="text-sm text-gray-400 max-w-sm">
                {isAR 
                  ? "قم بطرح أسئلة تكتيكية حول التدوير، نقاط الضعف، أو اطلب خطة لعب مبنية على بيانات الرصد المباشر." 
                  : "Ask tactical questions about rotations, weaknesses, or request a gameplan based on live scouting data."}
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-lg ${
                  m.role === "user" 
                  ? "bg-gradient-to-br from-red-600 to-red-800 text-white rounded-br-none" 
                  : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none"
                }`}>
                  {m.text}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
               <div className="max-w-[80%] rounded-2xl p-4 text-sm bg-gray-800 border border-gray-700 text-gray-400 rounded-bl-none flex gap-2 items-center">
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
               </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex gap-2 relative">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={isAR ? "اكتب سؤالك التكتيكي أو اطلب تحليل..." : "Type your tactical question or analysis request..."}
              className="flex-1 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 shadow-inner" />
            <button onClick={send} disabled={!input.trim() || isTyping} className="btn-primary px-6 rounded-lg font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
              <span>{isAR ? "تحليل" : "Analyze"}</span>
              <span>⚡</span>
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-gray-500">
            Powered by XURA AI Data Volley 4 Engine
          </div>
        </div>

      </div>
    </div>
  );
}
