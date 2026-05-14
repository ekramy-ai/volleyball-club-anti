// features/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  
  const [stats, setStats] = useState({ clubs: 0, teams: 0, players: 0, matches: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cRes, tRes, pRes, mRes] = await Promise.all([
          supabase.from("clubs").select("id", { count: "exact", head: true }),
          supabase.from("teams").select("id", { count: "exact", head: true }),
          supabase.from("players").select("id", { count: "exact", head: true }),
          supabase.from("matches").select("*, home:teams(name)").order("match_date", { ascending: false }).limit(3)
        ]);

        setStats({
          clubs: cRes.count || 0,
          teams: tRes.count || 0,
          players: pRes.count || 0,
          matches: mRes.count || 0
        });
        setRecentMatches(mRes.data || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const dateStr = new Date().toLocaleDateString(isAR ? "ar-EG" : "en-US", { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const cards = [
    { label: t("nav_clubs"), val: stats.clubs, icon: "🛡️", color: "from-red-600 to-red-900", link: "/clubs" },
    { label: t("nav_teams"), val: stats.teams, icon: "👥", color: "from-blue-600 to-blue-900", link: "/teams" },
    { label: t("nav_players"), val: stats.players, icon: "🤾", color: "from-gray-700 to-gray-900", link: "/players" },
    { label: t("nav_matches"), val: stats.matches, icon: "🏐", color: "from-orange-600 to-orange-900", link: "/matches" },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 sm:p-12 rounded-[2rem] border border-gray-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-start">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {isAR ? "نظام XURA للتحليل الفني" : "XURA Analytical Platform"}
            </h1>
            <p className="text-gray-400 mt-4 text-lg max-w-xl font-medium leading-relaxed">
              {isAR ? "إدارة الأندية، الفرق، ورصد المباريات بأعلى معايير الدقة العالمية." : "Professional club management, team scouting, and real-time performance analysis."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
              <Link to="/scouting" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-red-900/20 transition-all active:scale-95 flex items-center gap-2">
                <span>📡</span> {isAR ? "رصد مباشر الآن" : "Start Live Scouting"}
              </Link>
              <Link to="/ai" className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3.5 rounded-xl border border-gray-700 transition-all flex items-center gap-2">
                <span>🤖</span> {isAR ? "المساعد الذكي" : "AI Tactical Lab"}
              </Link>
            </div>
          </div>
          
          <div className="hidden lg:flex gap-4">
            <div className="flex flex-col gap-4 animate-float">
               <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-gray-700">📊</div>
               <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-gray-700 ml-8">🏐</div>
            </div>
            <div className="flex flex-col gap-4 mt-8 animate-float-delayed">
               <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-red-500">⚡</div>
               <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-gray-700 ml-8">🧠</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <Link key={i} to={c.link} className={`group relative bg-gradient-to-br ${c.color} p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl filter drop-shadow-lg">{c.icon}</span>
              <span className="text-white/20 font-black text-5xl group-hover:text-white/30 transition-colors">0{i+1}</span>
            </div>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest">{c.label}</p>
            <h3 className="text-4xl font-black text-white mt-1">
              {loading ? <span className="animate-pulse opacity-50">...</span> : c.val}
            </h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Matches Feed */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-red-600 rounded-full"></span>
              {isAR ? "المباريات الأخيرة" : "Recent Matches"}
            </h2>
            <Link to="/matches" className="text-sm text-red-500 font-bold hover:underline">{isAR ? "عرض الكل" : "View All"}</Link>
          </div>
          
          <div className="space-y-4">
            {recentMatches.length === 0 ? (
              <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                {isAR ? "لا توجد مباريات مسجلة حالياً" : "No matches recorded yet"}
              </div>
            ) : (
              recentMatches.map((m) => (
                <div key={m.id} className="bg-gray-800/40 border border-gray-700 p-5 rounded-2xl flex items-center justify-between hover:bg-gray-800/60 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-xl shadow-inner border border-gray-700 group-hover:border-red-500/50 transition-colors">🏐</div>
                    <div>
                      <h4 className="font-bold text-white text-base">{m.home?.name || "Team A"} vs {m.set_scores?.away_team_id ? "Opponent" : "Team B"}</h4>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{m.competition || "League Match"} · {new Date(m.match_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge bg-gray-900 text-gray-300 border border-gray-700 text-[10px] font-bold uppercase tracking-tighter">Status</span>
                    <div className="text-sm font-black text-red-500 mt-1">{m.status?.toUpperCase()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tactical Overview / AI Suggestion */}
        <div className="bg-gradient-to-b from-red-600/10 to-transparent border border-red-900/20 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl shadow-lg">🤖</div>
            <div>
              <h2 className="text-lg font-bold text-white">{isAR ? "توصية XURA AI" : "XURA AI Insight"}</h2>
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Tactical Feed</p>
            </div>
          </div>
          
          <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 flex-1 flex flex-col justify-center">
            <div className="text-red-500 mb-4 text-3xl">“</div>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              {isAR 
                ? "بناءً على أحدث بيانات الرصد، يميل الخصم لاستخدام الهجوم السريع من المركز 3 بنسبة 40% في بداية الأشواط. يُنصح بالبدء بحائط صد ملتزم (Commit Block)." 
                : "Based on recent scouting, the opponent tends to use Zone 3 quick attacks 40% of the time in set starts. Recommend starting with a Commit Block scheme."}
            </p>
            <Link to="/ai" className="mt-6 text-xs text-red-500 font-bold flex items-center gap-1 hover:gap-2 transition-all">
              {isAR ? "اقرأ التحليل الكامل" : "View Full Tactical Lab"} <span>→</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
