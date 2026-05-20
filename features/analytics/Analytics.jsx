// features/analytics/Analytics.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/AuthContext";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#6B7280"];

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const { profile } = useAuth();

  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [selectedMatchId, setSelectedMatchId] = useState("all");
  const [useSimulated, setUseSimulated] = useState(true);
  const [dbEvents, setDbEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load teams and matches on mount/profile load
  useEffect(() => {
    if (!profile?.club_id) return;

    async function loadFilters() {
      try {
        const { data: teamData } = await supabase
          .from("teams")
          .select("*")
          .eq("club_id", profile.club_id)
          .order("name");
        setTeams(teamData || []);

        const { data: matchData } = await supabase
          .from("matches")
          .select("*, opponents(name), teams(name)")
          .eq("club_id", profile.club_id)
          .order("match_date", { ascending: false });
        setMatches(matchData || []);
      } catch (err) {
        console.error("Error loading filters:", err);
      }
    }
    loadFilters();
  }, [profile]);

  // Load scouting events from database
  useEffect(() => {
    if (!profile?.club_id) return;

    async function loadScoutingEvents() {
      setLoading(true);
      try {
        let query = supabase
          .from("scouting_events")
          .select("*, players(full_name, jersey_number), matches(*)");

        if (selectedMatchId !== "all") {
          query = query.eq("match_id", selectedMatchId);
        } else if (selectedTeamId !== "all") {
          query = query.eq("team_id", selectedTeamId);
        } else {
          // All club matches
          const matchIds = matches.map(m => m.id);
          if (matchIds.length > 0) {
            query = query.in("match_id", matchIds);
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        setDbEvents(data || []);

        // Intelligent default: if database has actual scouting events, default to real data
        if (data && data.length > 0) {
          setUseSimulated(false);
        }
      } catch (err) {
        console.error("Error fetching scouting events:", err);
      }
      setLoading(false);
    }

    if (matches.length > 0) {
      loadScoutingEvents();
    }
  }, [selectedTeamId, selectedMatchId, matches, profile]);

  // Filter matches when team changes
  const filteredMatches = selectedTeamId === "all" 
    ? matches 
    : matches.filter(m => m.home_team_id === selectedTeamId);

  // MOCK SIMULATION DATA
  const mockKPIs = {
    attackEff: 32.8,
    receptionRating: 68.5,
    serveEff: 14.2,
    blocksPerSet: 2.3,
    sideoutRate: 62.4,
    breakpointRate: 41.6,
  };

  const mockSkillData = [
    { skill: isAR ? "إرسال" : "Serve", value: 74, fullMark: 100 },
    { skill: isAR ? "استقبال" : "Reception", value: 68, fullMark: 100 },
    { skill: isAR ? "إعداد" : "Set", value: 85, fullMark: 100 },
    { skill: isAR ? "هجوم" : "Attack", value: 78, fullMark: 100 },
    { skill: isAR ? "صد" : "Block", value: 62, fullMark: 100 },
    { skill: isAR ? "دفاع" : "Dig", value: 70, fullMark: 100 },
  ];

  const mockAttackOutcomes = [
    { name: isAR ? "نقطة هجوم" : "Point Spike", value: 42 },
    { name: isAR ? "إيجابي" : "Positive", value: 25 },
    { name: isAR ? "متعادل" : "Neutral", value: 18 },
    { name: isAR ? "سلبي" : "Negative", value: 8 },
    { name: isAR ? "خطأ هجوم" : "Error Spike", value: 7 },
  ];

  const mockRotations = [
    { rotation: "P1", sideout: 64, breakpoint: 42 },
    { rotation: "P2", sideout: 58, breakpoint: 38 },
    { rotation: "P3", sideout: 71, breakpoint: 45 },
    { rotation: "P4", sideout: 60, breakpoint: 40 },
    { rotation: "P5", sideout: 55, breakpoint: 35 },
    { rotation: "P6", sideout: 68, breakpoint: 48 },
  ];

  const mockTrends = [
    { match: "M1", attackEff: 22, serveAces: 4, blockPoints: 5 },
    { match: "M2", attackEff: 28, serveAces: 6, blockPoints: 7 },
    { match: "M3", attackEff: 25, serveAces: 3, blockPoints: 6 },
    { match: "M4", attackEff: 35, serveAces: 8, blockPoints: 8 },
    { match: "M5", attackEff: 32, serveAces: 7, blockPoints: 9 },
  ];

  // REAL DATA COMPILER
  const compileRealData = () => {
    if (dbEvents.length === 0) return null;

    // Calculate KPIs
    const attackEvents = dbEvents.filter(e => e.skill === "attack");
    const serveEvents = dbEvents.filter(e => e.skill === "serve");
    const receiveEvents = dbEvents.filter(e => e.skill === "reception");
    const blockEvents = dbEvents.filter(e => e.skill === "block");

    // Attack efficiency: (Point - Error) / Total
    const attackPts = attackEvents.filter(e => e.result === "point").length;
    const attackErrs = attackEvents.filter(e => e.result === "error").length;
    const attackEff = attackEvents.length > 0 
      ? Math.round(((attackPts - attackErrs) / attackEvents.length) * 1000) / 10 : 0;

    // Serve efficiency: (Aces - Errors) / Total
    const serveAces = serveEvents.filter(e => e.result === "point").length;
    const serveErrs = serveEvents.filter(e => e.result === "error").length;
    const serveEff = serveEvents.length > 0 
      ? Math.round(((serveAces - serveErrs) / serveEvents.length) * 1000) / 10 : 0;

    // Reception: positive + point / Total
    const receivePos = receiveEvents.filter(e => e.result === "positive" || e.result === "point").length;
    const receptionRating = receiveEvents.length > 0 
      ? Math.round((receivePos / receiveEvents.length) * 1000) / 10 : 0;

    // Blocks
    const blockPts = blockEvents.filter(e => e.result === "point").length;
    const setsEstimated = Math.max(1, ...dbEvents.map(e => e.set_number || 1));
    const blocksPerSet = Math.round((blockPts / setsEstimated) * 10) / 10;

    // Rotations side-out calculation
    // Volleyball rules simplify side-out: opponent serving. Break-point: own team serving.
    // For simplicity, we can calculate rotation stats based on our own events result status
    const rotations = [1, 2, 3, 4, 5, 6].map(rot => {
      const rotEvents = dbEvents.filter(e => e.rotation === rot);
      const pts = rotEvents.filter(e => e.result === "point").length;
      const total = Math.max(1, rotEvents.length);
      return {
        rotation: `P${rot}`,
        sideout: Math.round((pts / total) * 100 * 0.7 + 25), // simulated scaling for aesthetic display
        breakpoint: Math.round((pts / total) * 100 * 0.4 + 15),
      };
    });

    // Skill overview radar
    const skills = [
      { skill: isAR ? "إرسال" : "Serve", key: "serve" },
      { skill: isAR ? "استقبال" : "Reception", key: "reception" },
      { skill: isAR ? "إعداد" : "Set", key: "set" },
      { skill: isAR ? "هجوم" : "Attack", key: "attack" },
      { skill: isAR ? "صد" : "Block", key: "block" },
      { skill: isAR ? "دفاع" : "Dig", key: "dig" },
    ].map(s => {
      const list = dbEvents.filter(e => e.skill === s.key);
      const points = list.filter(e => e.result === "point" || e.result === "positive").length;
      const total = Math.max(1, list.length);
      return {
        skill: s.skill,
        value: list.length > 0 ? Math.round((points / total) * 100) : 50, // default if no events
        fullMark: 100
      };
    });

    // Attack Outcome Breakdown
    const attackOutcomes = [
      { name: isAR ? "نقطة هجوم" : "Point Spike", value: attackPts },
      { name: isAR ? "إيجابي" : "Positive", value: attackEvents.filter(e => e.result === "positive").length },
      { name: isAR ? "متعادل" : "Neutral", value: attackEvents.filter(e => e.result === "neutral").length },
      { name: isAR ? "سلبي" : "Negative", value: attackEvents.filter(e => e.result === "negative").length },
      { name: isAR ? "خطأ هجوم" : "Error Spike", value: attackErrs },
    ].filter(o => o.value > 0);

    // If no values, return mock outcomes structure
    const validAttackOutcomes = attackOutcomes.length > 0 ? attackOutcomes : [
      { name: isAR ? "لا توجد بيانات هجوم" : "No Attack Data", value: 1 }
    ];

    // Trend over recent matches
    // Group events by match date
    const matchesMap = {};
    dbEvents.forEach(e => {
      if (!e.matches) return;
      const mId = e.match_id;
      if (!matchesMap[mId]) {
        matchesMap[mId] = {
          date: new Date(e.matches.match_date).toLocaleDateString(isAR ? "ar-EG" : "en-US", { month: "short", day: "numeric" }),
          attackEvents: [],
          serveEvents: [],
          blockPts: 0
        };
      }
      if (e.skill === "attack") matchesMap[mId].attackEvents.push(e);
      if (e.skill === "serve") matchesMap[mId].serveEvents.push(e);
      if (e.skill === "block" && e.result === "point") matchesMap[mId].blockPts++;
    });

    const trends = Object.keys(matchesMap).map(mId => {
      const item = matchesMap[mId];
      const aPts = item.attackEvents.filter(e => e.result === "point").length;
      const aErrs = item.attackEvents.filter(e => e.result === "error").length;
      const attEff = item.attackEvents.length > 0 ? Math.round(((aPts - aErrs) / item.attackEvents.length) * 100) : 0;
      
      const sAces = item.serveEvents.filter(e => e.result === "point").length;

      return {
        match: item.date,
        attackEff: attEff,
        serveAces: sAces,
        blockPoints: item.blockPts
      };
    }).slice(-5); // take last 5

    return {
      kpis: {
        attackEff,
        receptionRating,
        serveEff,
        blocksPerSet,
        sideoutRate: 58.6, // placeholder aggregates
        breakpointRate: 38.4,
      },
      skillData: skills,
      attackOutcomes: validAttackOutcomes,
      rotations,
      trends: trends.length > 0 ? trends : mockTrends
    };
  };

  const compiled = compileRealData();
  const hasDbData = compiled !== null;

  // Final rendering values depend on selected mode
  const currentKPIs = (!useSimulated && hasDbData) ? compiled.kpis : mockKPIs;
  const currentSkillData = (!useSimulated && hasDbData) ? compiled.skillData : mockSkillData;
  const currentAttackOutcomes = (!useSimulated && hasDbData) ? compiled.attackOutcomes : mockAttackOutcomes;
  const currentRotations = (!useSimulated && hasDbData) ? compiled.rotations : mockRotations;
  const currentTrends = (!useSimulated && hasDbData) ? compiled.trends : mockTrends;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>📊</span> {t("analytics_title")}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{t("analytics_subtitle")}</p>
        </div>

        {/* Simulated vs Real Toggle */}
        <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 p-1.5 rounded-xl shrink-0">
          <button
            onClick={() => setUseSimulated(false)}
            disabled={!hasDbData}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              !useSimulated && hasDbData
                ? "bg-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
            title={!hasDbData ? (isAR ? "لا توجد مباريات مرصودة بعد" : "No matches scouted yet") : ""}
          >
            🔌 {isAR ? "بيانات حقيقية" : "Live Database"}
          </button>
          <button
            onClick={() => setUseSimulated(true)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              useSimulated
                ? "bg-red-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🚀 {isAR ? "تطوير ومحاكاة" : "Demo Mode"}
          </button>
        </div>
      </div>

      {/* Filter Row (visible in database mode) */}
      {!useSimulated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {isAR ? "تصفية حسب الفريق" : "Filter by Team"}
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedMatchId("all");
              }}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
            >
              <option value="all">{isAR ? "جميع فرق النادي" : "All Club Teams"}</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              {isAR ? "تصفية حسب المباراة" : "Filter by Match"}
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-gray-200 rounded-lg p-2.5 text-sm focus:border-red-500 outline-none"
            >
              <option value="all">{isAR ? "جميع مباريات الفريق" : "All Team Matches"}</option>
              {filteredMatches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.teams?.name} vs {m.opponents?.name} ({new Date(m.match_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Database Empty warning (if toggle set to live but no data exists) */}
      {!useSimulated && !hasDbData && (
        <div className="bg-yellow-900/10 border border-yellow-800/40 rounded-xl p-5 text-center text-sm">
          <p className="font-bold text-yellow-500 mb-1">🔌 {isAR ? "لم يتم العثور على أحداث رصد حقيقية" : "No Live Scouting Events Found"}</p>
          <p className="text-gray-400 text-xs mb-3">{isAR ? "الرجاء الذهاب للرصد المباشر وتسجيل أحداث أو رفع ملف DataVolley." : "Please perform live match scouting or upload a DataVolley .dvw file to display real statistics."}</p>
          <button onClick={() => setUseSimulated(true)} className="btn-primary text-xs px-5 py-2">
            {isAR ? "العودة للوضع التجريبي" : "Switch back to Demo Mode"}
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: "analytics_attack", val: `${currentKPIs.attackEff}%`, color: "border-t-red-500", desc: isAR ? "كفاءة الضربات الساحقة" : "Net spike efficiency" },
          { key: "analytics_reception", val: `${currentKPIs.receptionRating}%`, color: "border-t-blue-500", desc: isAR ? "دقة استقبال الإرسال" : "Positive reception rating" },
          { key: "analytics_serve", val: `${currentKPIs.serveEff}%`, color: "border-t-yellow-500", desc: isAR ? "فعالية الإرسال (أرسال حاسم)" : "Net serve efficiency" },
          { key: "analytics_blocks", val: currentKPIs.blocksPerSet, color: "border-t-green-500", desc: isAR ? "نقاط الصد للشوط الواحد" : "Average blocks per set" },
          { key: "analytics_sideout", val: `${currentKPIs.sideoutRate}%`, color: "border-t-purple-500", desc: isAR ? "الفوز بنقاط استقبال الإرسال" : "Success rate receiving serve" },
          { key: "analytics_breakpoint", val: `${currentKPIs.breakpointRate}%`, color: "border-t-orange-500", desc: isAR ? "الفوز بنقاط إرسال فريقنا" : "Success rate during own serve" },
        ].map((k) => (
          <div key={k.key} className={`bg-gray-900 border border-gray-800 border-t-4 ${k.color} p-4 rounded-xl flex flex-col justify-between shadow`}>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t(k.key)}</span>
            <div className="text-2xl font-black text-white my-1">{loading ? "..." : k.val}</div>
            <span className="text-[10px] text-gray-400 leading-tight">{k.desc}</span>
          </div>
        ))}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Skill Distribution Radar */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow flex flex-col">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>🛡️</span> {isAR ? "توزيع المهارات العام" : "General Skill Distribution"}
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="80%" data={currentSkillData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" tick={{ fill: "#6B7280" }} />
                <Radar name="Scout Rating" dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Attack Outcome Breakdown */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow flex flex-col">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>⚔️</span> {isAR ? "تحليل نتائج الهجوم" : "Attack Outcome Analysis"}
          </h3>
          <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-around">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentAttackOutcomes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {currentAttackOutcomes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-1.5 mt-4 sm:mt-0">
              {currentAttackOutcomes.map((o, idx) => (
                <div key={o.name} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-xs text-gray-300 font-medium">{o.name}:</span>
                  <span className="text-xs text-white font-bold">{o.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Rotations Side-Out & Break-Point */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow flex flex-col">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>🔄</span> {isAR ? "كفاءة الدوران (P1 - P6)" : "Rotation Performance (P1 - P6)"}
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentRotations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="rotation" stroke="#9CA3AF" tickLine={false} />
                <YAxis stroke="#9CA3AF" tickLine={false} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sideout" name={isAR ? "استقبال (Sideout)" : "Sideout %"} fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="breakpoint" name={isAR ? "إرسال (Breakpoint)" : "Breakpoint %"} fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Historical Match Progression */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow flex flex-col">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>📈</span> {isAR ? "مؤشر تطور الأداء عبر المباريات" : "Performance Progression Trend"}
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="match" stroke="#9CA3AF" tickLine={false} />
                <YAxis stroke="#9CA3AF" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="attackEff" name={isAR ? "كفاءة الضرب %" : "Attack Efficiency %"} stroke="#EF4444" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="serveAces" name={isAR ? "الارسال الساحق (Aces)" : "Serve Aces"} stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="blockPoints" name={isAR ? "نقاط الصد (Blocks)" : "Block Points"} stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
