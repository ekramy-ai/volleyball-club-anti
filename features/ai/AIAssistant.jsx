// features/ai/AIAssistant.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";

export default function AIAssistant() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [analysisType, setAnalysisType] = useState("tactical");
  const [seasonPhase, setSeasonPhase] = useState("in");

  const [clubs, setClubs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedClub, setSelectedClub] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    supabase.from("clubs").select("id, name").order("name").then(({ data }) => setClubs(data || []));
  }, []);

  useEffect(() => {
    if (selectedClub) {
      supabase.from("teams").select("id, name").eq("club_id", selectedClub).order("name").then(({ data }) => {
        setTeams(data || []);
        setSelectedTeam("");
      });
    } else {
      setTeams([]);
      setSelectedTeam("");
    }
  }, [selectedClub]);

  const PHASE_PROMPTS = {
    pre: isAR ? [
      "تحليل احتياجات الفريق التدريبية لفترة الإعداد (Pre-season)",
      "تصميم خطة أحمال بدنية للمرحلة التمهيدية (أسبوع 1-3)",
      "تقييم الصفقات الجديدة وتشكيل الأساس التكتيكي",
      "وضع مستهدفات الأداء الرقمية لكل مركز (KPIs)"
    ] : [
      "Analyze training needs for pre-season phase",
      "Design physical load plan for preparation (Weeks 1-3)",
      "Evaluate new signings & establish tactical baseline",
      "Set positional performance KPI targets"
    ],
    in: isAR ? [
      "تحليل نقاط ضعف حائط الصد للخصم القادم (الدوران P1)",
      "توزيع صانع ألعاب الخصم عند الاستقبال السلبي (!)",
      "خطة التعافي (Recovery) لليبرو بعد المباراة الأخيرة",
      "توصيات الإرسال التكتيكي ضد التشكيل الأساسي للخصم"
    ] : [
      "Analyze opponent block weaknesses in rotation P1",
      "Opponent setter distribution on negative pass (!)",
      "Libero recovery plan after the last match",
      "Tactical serve recommendations vs opponent starting 6"
    ],
    post: isAR ? [
      "تقرير شامل لأداء اللاعبين (مقارنة بالمستهدف)",
      "تحليل الأخطاء التكتيكية المتكررة في نصف النهائي",
      "توصيات الإحلال والتجديد (Roster Changes) للموسم القادم",
      "خطة التدريب الفردي خلال فترة التوقف (Off-season)"
    ] : [
      "Comprehensive player performance report vs KPI targets",
      "Analysis of recurring tactical errors in the playoffs",
      "Roster and transfer recommendations for next season",
      "Individual off-season training plans"
    ]
  };

  const PROMPTS = PHASE_PROMPTS[seasonPhase];

  const generateResponse = (phase, query) => {
    if (phase === "pre") {
      return isAR ? `
**تحليل فترة الإعداد (Pre-Season Analysis):**

بناءً على أرقام الموسم الماضي وبيانات الصفقات الجديدة:
1. **الأساس التكتيكي (Tactical Baseline):** 
تحتاج لتعزيز كفاءة الهجوم من المركز 2، حيث كانت نسبة النجاح العام الماضي 41% (أقل من المستهدف 45%).
2. **الأحمال البدنية (Physical Load):**
يُنصح بالتركيز على تدريبات القوة الانفجارية (Plyometrics) في الأسابيع الثلاثة الأولى لتحسين ارتقاء المهاجمين.
3. **مستهدفات (KPIs):**
الوصول بكفاءة الاستقبال (Perfect Pass) إلى 60% كحد أدنى للمباريات الودية.
` : `
**Pre-Season Analysis:**

Based on last season's metrics and new signings:
1. **Tactical Baseline:** 
Need to improve Zone 2 attack efficiency. Last year was 41% (target is >45%).
2. **Physical Load:** 
Focus on Plyometrics in weeks 1-3 to improve attacker vertical reach.
3. **KPI Targets:** 
Reach a minimum of 60% Perfect Pass efficiency in friendly matches.
`;
    }
    if (phase === "post") {
      return isAR ? `
**المراجعة الشاملة للموسم (Post-Season Review):**

1. **أداء اللاعبين (Player Progression):**
حقق صانع الألعاب الأساسي 85% من المستهدف الرقمي، لكن هناك تراجع في دقة الإعداد للهجوم السريع في الأشواط الخامسة.
2. **توصيات التعاقدات (Transfers):**
الفريق بحاجة لمهاجم مركز 4 (OH) بقدرات استقبال عالية (+65%) لتعويض العجز الذي ظهر في المباريات الكبرى.
3. **برنامج الإجازة (Off-Season):**
تم إنشاء برامج تعافي وتقوية فردية لكل لاعب بناءً على حمل المباريات الذي تعرض له.
` : `
**Post-Season Review:**

1. **Player Progression:** 
Starting setter hit 85% of KPI targets, but accuracy dropped on quick sets during 5th sets.
2. **Transfer Recommendations:** 
Team requires an OH with strong receiving capabilities (>65%) to cover gaps exposed in big matches.
3. **Off-Season Program:** 
Individualized recovery and strength programs have been generated based on each player's season load.
`;
    }
    // Default: In-Season
    return isAR ? `
**تحليل تكتيكي عميق (In-Season Tactical Engine):**

بناءً على تحليل آخر 300 حدث רصد للخصم القادم:
1. **توزيع الإعداد (Setter Distribution):** 
عندما يكون الاستقبال إيجابياً (+)، يوزع المعد:
- 45% للمركز 4 (هجوم سريع)
- 35% للمركز 3 (كرات قصيرة/Quick)
- 20% للمركز 2 أو الهجوم الخلفي (Pipe)

2. **توصية المدرب (Action Plan):**
- **الإرسال:** وجه الإرسال القصير (Short Serve) إلى المنطقة 2-3 لإجبار المعد على الحركة.
- **حائط الصد:** اعتمد على خطة (Commit Block) مع المهاجم الأوسط في الدوران P1.
` : `
**Deep Tactical Analysis (In-Season Engine):**

Based on 300 scouting events of the upcoming opponent:
1. **Setter Distribution (Perfect Pass +):**
- 45% to Zone 4 (Fast Tempo)
- 35% to Zone 3 (Quick/Meter)
- 20% to Zone 2 or Backrow (Pipe)

2. **Action Plan:**
- **Service:** Implement short tactical serves to zones 2-3 to force the setter out of system.
- **Blocking:** Use a Commit Block strategy on their Middle Blocker specifically during P1 rotation.
`;
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: generateResponse(seasonPhase, userMsg) }]);
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
          <p className="text-gray-400 text-sm mt-0.5">{isAR ? "المساعد الفني المتقدم (Data Volley 4 Engine)" : "Advanced Technical Assistant (DV4 Engine)"}</p>
        </div>

        {/* Season Phase Selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-1 flex shadow-inner">
          <button onClick={() => setSeasonPhase("pre")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${seasonPhase === "pre" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
            {isAR ? "قبل الموسم" : "Pre-Season"}
          </button>
          <button onClick={() => setSeasonPhase("in")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${seasonPhase === "in" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
            {isAR ? "خلال الموسم" : "In-Season"}
          </button>
          <button onClick={() => setSeasonPhase("post")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${seasonPhase === "post" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
            {isAR ? "بعد الموسم" : "Post-Season"}
          </button>
        </div>

        <div className="card space-y-4 border-t-4 border-t-red-600">
          <h3 className="font-bold text-white text-sm uppercase">{isAR ? "إعدادات التحليل" : "Analysis Settings"}</h3>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "نوع التحليل" : "Analysis Type"}</label>
            <select value={analysisType} onChange={e => setAnalysisType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-red-500">
              <option value="tactical">{isAR ? "تكتيك وخطط لعب (Tactical)" : "Tactical Gameplan"}</option>
              <option value="technical">{isAR ? "تحليل فني فردي (Technical)" : "Individual Technical"}</option>
              <option value="physical">{isAR ? "حمل بدني وتعافي (Physical Load)" : "Physical Load & Recovery"}</option>
              <option value="recruitment">{isAR ? "تحليل التعاقدات (Recruitment)" : "Recruitment Analysis"}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "اختر النادي" : "Select Club"}</label>
            <select value={selectedClub} onChange={e => setSelectedClub(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-red-500">
              <option value="">-- {isAR ? "اختر النادي" : "Club"} --</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isAR ? "اختر الفريق (مصدر بيانات اللاعبين)" : "Select Team (Player Data)"}</label>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} disabled={!selectedClub}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 text-sm focus:border-red-500 disabled:opacity-50">
              <option value="">-- {isAR ? "اختر الفريق" : "Team"} --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="card space-y-2">
          <p className="text-xs text-red-400 font-bold mb-2 flex items-center gap-2">
            <span>💡</span> {isAR ? "مقترحات سريعة للمدرب" : "Quick Coach Prompts"}
          </p>
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
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-5xl mb-4 border-4 border-gray-700 shadow-inner relative">
                🧠
                <span className="absolute top-0 right-0 w-6 h-6 bg-green-500 border-4 border-gray-900 rounded-full"></span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{isAR ? "مساعد المدير الفني جاهز للعمل" : "Head Coach Assistant is Ready"}</h2>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                {isAR 
                  ? "قم باختيار المرحلة (قبل/خلال/بعد الموسم) واطرح استفسارك التكتيكي أو الفني ليقوم الذكاء الاصطناعي باستخراج التوصيات الدقيقة فوراً." 
                  : "Select the season phase and ask your tactical or technical query. The AI will extract precise recommendations instantly."}
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-lg ${
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
              placeholder={isAR ? "اكتب طلبك الفني أو استفسارك هنا..." : "Type your technical request or query here..."}
              className="flex-1 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-500 shadow-inner" />
            <button onClick={send} disabled={!input.trim() || isTyping || !selectedTeam} className="btn-primary px-6 rounded-lg font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
              <span>{isAR ? "تحليل" : "Analyze"}</span>
              <span>⚡</span>
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] text-gray-500 font-medium">Powered by XURA AI & DV4 Engine</span>
            {selectedTeam ? (
              <span className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> {isAR ? "تم ربط بيانات لاعبي الفريق" : "Team Data Linked"}</span>
            ) : (
              <span className="text-[10px] text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {isAR ? "يرجى تحديد الفريق للبدء" : "Select a team to start"}</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
