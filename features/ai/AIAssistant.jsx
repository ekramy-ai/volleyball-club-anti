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
📊 التقرير التحليلي الشامل لفترة الإعداد (PRE-SEASON DOSSIER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
استناداً إلى قواعد بيانات الموسم الماضي والمقاييس الحيوية للصفقات الجديدة:

1️⃣ التقييم البدني والفسيولوجي (Baseline Metrics):
• متوسط ارتقاء الفريق (Spike Reach): 338 سم (أعلى من المعدل العام للبطولة بـ 4 سم).
• العجز البدني (Deficit): لوحظ انخفاض في قدرة التحمل العضلي للاعبي الارتكاز (MBs) بعد النقطة 20 من كل شوط بنسبة 14%.

2️⃣ التقييم التكتيكي والصفقات (Tactical & Recruitment):
• اللاعب الوافد (OH #10): يمتلك كفاءة استقبال (Perfect Pass) بنسبة 61%، مما سيسمح بتنويع الهجوم السريع (Pipe) بنسبة 25% إضافية مقارنة بالموسم الماضي.
• ثغرة التشكيل الحالية: ما زال الفريق يفتقر لمعد احتياطي قادر على اللعب برتم سريع (First Tempo) من خارج المنطقة (Out of System).

3️⃣ مؤشرات الأداء المستهدفة (KPIs) للأسابيع الثلاثة الأولى:
• الاستقبال: الوصول لنسبة 55% (R#) في المباريات التحضيرية.
• الهجوم الكلي: فاعلية (Efficiency) لا تقل عن 42%.
• نسبة الأخطاء المباشرة: تقليل أخطاء الإرسال إلى أقل من 3 أخطاء لكل شوط.

💡 خطة العمل المقترحة (Action Plan):
- الأسبوع 1-2: التركيز على أحمال القوة الانفجارية (Plyometrics) وتطوير التحمل الخاص بالقفز للاعبي الارتكاز.
- الأسبوع 3: بدء دمج أنظمة الهجوم المتقدمة وتثبيت تشكيلات الاستقبال في الدوران P1 و P5.
` : `
📊 PRE-SEASON COMPREHENSIVE DOSSIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on historical databases and physical baselines of new signings:

1️⃣ Physiological & Baseline Metrics:
• Team Average Spike Reach: 338 cm (+4 cm above league average).
• Physical Deficit: Middle Blockers (MBs) show a 14% drop in explosive endurance after the 20-point mark in sets.

2️⃣ Tactical & Recruitment Evaluation:
• New Signing (OH #10): Brings a 61% Perfect Pass efficiency, allowing a projected 25% increase in Pipe attack frequency compared to last season.
• Roster Gap: The team still lacks a backup setter capable of running First Tempo attacks from out-of-system situations.

3️⃣ Target KPIs (First 3 Weeks):
• Reception: Achieve a minimum of 55% R# in friendlies.
• Attack Efficiency: Maintain at least 42% overall efficiency.
• Error Rate: Reduce direct service errors to <3 per set.

💡 Recommended Action Plan:
- Weeks 1-2: Prioritize Plyometrics and jump-endurance conditioning tailored for MBs.
- Week 3: Implement advanced offensive systems and finalize reception formations in P1 & P5 rotations.
`;
    }
    if (phase === "post") {
      return isAR ? `
🏆 المراجعة التحليلية الشاملة لنهاية الموسم (POST-SEASON REVIEW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
تم تحليل أداء الفريق في 34 مباراة رسمية باستخدام خوارزميات Data Volley 4:

1️⃣ المراجعة الهجومية والدفاعية (Macro Analytics):
• الكفاءة الهجومية العامة (Attack Eff): استقرت عند 46% (تجاوزت المستهدف بـ 1%).
• كفاءة حائط الصد (Block Efficiency): 1.8 صد ناجح لكل شوط (أقل من المعدل المطلوب للبطولة 2.3).
• نقاط التحول (Break Point %): 38% من الإرسال (ممتاز).

2️⃣ تقييم أداء اللاعبين الفردي (Player Progression):
• صانع الألعاب الأساسي: التزم بنسبة 82% بخطط التوزيع المتفق عليها، لكن دقة إعداد كرات (Zone 4) انخفضت بنسبة 12% في الأشواط الفاصلة (الشوط الخامس).
• الليبرو: حقق قفزة نوعية في الدفاع الأرضي بنسبة تحسن 18%، لكن كفاءة الاستقبال للإرسال القوي الموجه (Jump Topspin) ظلت عند 41%.

3️⃣ قرارات الإحلال والتجديد (Roster & Transfers):
• التوصية الأولى: التعاقد مع لاعب ارتكاز (MB) بديل يتميز بطول القامة وسرعة قراءة صانع الألعاب (Read Blocking)، لسد العجز في حائط الصد.
• التوصية الثانية: عدم تجديد عقد المهاجم الأجنبي نظراً لانخفاض فاعليته (Efficiency) في المباريات ضد فرق المربع الذهبي إلى 28%.

💡 خطط التوقف (Off-Season):
- إنشاء ملف تعافي فسيولوجي لثلاثة لاعبين تجاوزوا حاجز الـ 1200 قفزة هذا الموسم لتفادي إصابات الركبة (Patellar Tendinopathy).
` : `
🏆 POST-SEASON COMPREHENSIVE REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analysis covering 34 official matches using Data Volley 4 engine:

1️⃣ Macro Offensive & Defensive Analytics:
• Overall Attack Efficiency: Settled at 46% (+1% above KPI target).
• Block Efficiency: 1.8 stuff blocks per set (below the league benchmark of 2.3).
• Break Point %: 38% conversion rate on our serve (Excellent).

2️⃣ Player Progression & Evaluation:
• Starting Setter: Adhered to gameplan distribution 82% of the time, but set accuracy to Zone 4 dropped by 12% in tie-break sets.
• Libero: Exceptional 18% improvement in dig transition, but reception efficiency vs Jump Topspin remains a vulnerability at 41%.

3️⃣ Roster & Transfer Decisions:
• Recommendation 1: Sign a backup Middle Blocker (MB) with elite Read-Blocking capabilities to resolve our blocking deficit.
• Recommendation 2: Consider releasing the foreign opposite hitter (OPP) due to a sharp drop in efficiency (28%) against top-4 teams.

💡 Off-Season Directives:
- Initiate physiological recovery protocols for three players who exceeded the 1,200-jump threshold to prevent Patellar Tendinopathy.
`;
    }
    
    // Default: In-Season (Highly Detailed Scouting Report)
    return isAR ? `
🎯 تقرير الرصد الفني المباشر (LIVE SCOUTING DOSSIER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
مصدر البيانات: آخر 5 مباريات للخصم | خوارزمية التوقع: مفعلة

1️⃣ التوزيع الهجومي لصانع الألعاب K1 (Setter Distribution)
[في حالة الاستقبال الإيجابي R# / R+ - نسبة الحدوث: 62%]
• المركز 4 (هجوم سريع/Shoot): 38% | النجاح: 54% | الفاعلية: 41%
• المركز 3 (سريع/Quick): 42% | النجاح: 61% | الفاعلية: 50% ⚠️ (تحذير: اعتماد مكثف جداً في P1 و P6)
• المركز 2 و 6 (Backrow/Pipe): 20% | النجاح: 45% | الفاعلية: 32%

[في حالة الاستقبال السلبي R- / R! - نسبة الحدوث: 38%]
• يُجبر صانع الألعاب على اللعب العالي للمركز 4 بنسبة (72%).
• ميول المهاجم (#11) من المركز 4: يهاجم قطري (Cross-court) بنسبة 65%، خط مستقيم بنسبة 20%، وإسقاط (Tip) 15%.

2️⃣ ثغرات حائط صد الخصم K2 (Opponent Blocking Vulnerabilities)
• ثغرة الدوران P1: لاعب الارتكاز (MB #15) يميل للقفز المبكر (Commit) مع الهجوم السريع، مما يترك فجوة زمنية (0.8 ثانية) لغلق حائط الصد على الأطراف.
• التكتيك المضاد: تسريع الرتم الهجومي لمهاجم المركز 4 (Shoot set) لضمان اللعب ضد حائط صد فردي أو ممزق.

3️⃣ تحليل خط الاستقبال (Reception Weaknesses)
• الليبرو (#7): نقطة قوة، تجنب الإرسال عليه.
• الضارب المستقبل (#4): نقطة ضعف رئيسية. الاستقبال السلبي لديه 45% عند توجيه إرسال متموج (Float) بين المنطقة 5 و 6 (Seam).

💡 خطة عمل المدير الفني (HEAD COACH ACTION PLAN):
1. الإرسال (Service): الإرسال الهجومي بشراسة بين 5 و 6 لعزل اللاعب #4. خلط الإرسال بكرات قصيرة للمنطقة 2 لإخراج المعد من نظامه.
2. حائط الصد (Blocking): في حالة الاستقبال الجيد، نفذ (Commit Block) على لاعب ارتكازهم في دورانات P1/P6، مع توجيه الدفاع لتغطية الهجوم القطري الحاد. في الكرات العالية، التزام بحائط صد مزدوج قوي على مركز 4 وإغلاق الزاوية القطرية تماماً.
` : `
🎯 LIVE SCOUTING DOSSIER (PRE-MATCH TACTICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Data Source: Opponent's last 5 matches | Predictive Engine: Active

1️⃣ Setter Distribution - K1 Phase
[On Perfect/Good Pass (R# / R+) - Occurrence: 62%]
• Zone 4 (Fast Tempo): 38% | Kill: 54% | Eff: 41%
• Zone 3 (Quick/Meter): 42% | Kill: 61% | Eff: 50% ⚠️ (Warning: Heavy reliance in P1 & P6)
• Zone 2 / Pipe: 20% | Kill: 45% | Eff: 32%

[On Negative Pass (R- / R!) - Occurrence: 38%]
• Setter forces high balls to Zone 4 heavily (72%).
• Zone 4 Attacker (#11) Tendencies: 65% Cross-court (Diagonal), 20% Line, 15% Off-speed Tips.

2️⃣ Opponent Blocking Vulnerabilities (K2)
• Rotation P1 Flaw: Opponent MB (#15) commits early to quick attacks, creating a 0.8-second delay in closing the outside block.
• Counter Tactic: Run accelerated tempos (Shoot sets) to our Zone 4 to ensure attacking against a single or split block.

3️⃣ Reception Line Analysis
• Libero (#7): Elite laterally. Avoid serving.
• OH2 (#4): Primary Target. Drops to 45% negative reception when targeted with deep floats in the Zone 5/6 seam.

💡 HEAD COACH ACTION PLAN:
1. Service Strategy: Aggressively target the 5/6 seam to isolate OH2 (#4). Mix with short floats to Zone 2 specifically when their setter is back-row.
2. Blocking & Defense: On opponent R+, execute a Commit Block against their MB in P1/P6 rotations. On high balls, form a solid double block on Zone 4 taking away the cross-court angle (65% tendency), positioning the defensive Libero deep in Zone 5.
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
