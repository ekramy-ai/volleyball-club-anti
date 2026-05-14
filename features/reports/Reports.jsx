// features/reports/Reports.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Reports() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState("in"); // pre, in, post

  const REPORT_CATEGORIES = {
    pre: [
      { id: "pre1", titleAR: "تقرير التقييم البدني (Baseline)", titleEN: "Physical Baseline Report", descAR: "قياسات اللاعبين قبل بداية الموسم", descEN: "Player measurements before season", icon: "💪" },
      { id: "pre2", titleAR: "تحليل الصفقات الجديدة", titleEN: "New Signings Analysis", descAR: "مقارنة الوافدين بالمستهدف الرقمي", descEN: "Comparing newcomers to target KPIs", icon: "🤝" },
      { id: "pre3", titleAR: "تقرير معسكر الإعداد", titleEN: "Training Camp Report", descAR: "ملخص المباريات الودية والتشكيلات", descEN: "Summary of friendlies and lineups", icon: "🏕️" },
    ],
    in: [
      { id: "in1", titleAR: "تقرير ما قبل المباراة (Scouting)", titleEN: "Pre-Match Scouting Report", descAR: "خطة اللعب ضد الخصم القادم (Gameplan)", descEN: "Gameplan against upcoming opponent", icon: "📡" },
      { id: "in2", titleAR: "تحليل المباراة الفني (Post-Match)", titleEN: "Post-Match Technical Analysis", descAR: "أرقام المباراة وتوزيع الإعداد", descEN: "Match metrics and setter distribution", icon: "📊" },
      { id: "in3", titleAR: "تتبع أداء اللاعبين (Player Tracking)", titleEN: "Player Performance Tracking", descAR: "معدلات التطور والإرهاق الفردية", descEN: "Individual progression and fatigue rates", icon: "🤾" },
      { id: "in4", titleAR: "تقرير الكفاءة التكتيكية", titleEN: "Tactical Efficiency Report", descAR: "تحليل كفاءة حائط الصد والهجوم حسب الدوران", descEN: "Block & Attack efficiency by rotation", icon: "🧠" },
    ],
    post: [
      { id: "post1", titleAR: "المراجعة السنوية الشاملة", titleEN: "Comprehensive Annual Review", descAR: "تقييم أداء الفريق مقارنة بالأهداف", descEN: "Team performance vs season goals", icon: "🏆" },
      { id: "post2", titleAR: "توصيات التجديد والتعاقدات", titleEN: "Renewal & Transfer Recommendations", descAR: "اللاعبين المغادرين واحتياجات المراكز", descEN: "Departures and positional needs", icon: "📝" },
      { id: "post3", titleAR: "خطط التطور الفردي (Off-Season)", titleEN: "Off-Season Development Plans", descAR: "برامج فردية للاعبين فترة التوقف", descEN: "Individual programs during break", icon: "📈" },
    ]
  };

  const tabs = [
    { id: "pre", labelAR: "قبل الموسم (Pre-Season)", labelEN: "Pre-Season" },
    { id: "in", labelAR: "خلال الموسم (In-Season)", labelEN: "In-Season" },
    { id: "post", labelAR: "بعد الموسم (Post-Season)", labelEN: "Post-Season" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="text-red-500">📄</span> {isAR ? "مركز التقارير الفنية (Director Hub)" : "Technical Director Hub"}
          </h1>
          <p className="text-gray-400 text-base mt-2 max-w-2xl leading-relaxed">
            {isAR 
              ? "منصة شاملة لتوليد تقارير متقدمة للمدير الفني في مختلف مراحل الموسم. استخرج البيانات بضغطة زر لدعم اتخاذ القرار." 
              : "Comprehensive platform generating advanced reports for the Head Coach across all season phases. Extract data with a click to support decision-making."}
          </p>
        </div>
      </div>

      {/* Season Phase Tabs */}
      <div className="flex space-x-2 space-x-reverse bg-gray-900/50 p-1.5 rounded-xl border border-gray-800 max-w-2xl mx-auto backdrop-blur">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
              ? "bg-red-600 text-white shadow-lg transform scale-[1.02]" 
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            {isAR ? tab.labelAR : tab.labelEN}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORT_CATEGORIES[activeTab].map((report) => (
          <div key={report.id} className="bg-gray-900 border border-gray-800 hover:border-red-500/50 rounded-2xl p-6 shadow-xl transition-all group hover:-translate-y-1 relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-2xl group-hover:bg-red-900/20 group-hover:border-red-500/30 transition-colors">
                {report.icon}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{isAR ? report.titleAR : report.titleEN}</h3>
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                  {activeTab.toUpperCase()} PHASE
                </span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm flex-1 mb-6 leading-relaxed">
              {isAR ? report.descAR : report.descEN}
            </p>
            
            <div className="flex gap-3 mt-auto">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
                <span>{isAR ? "توليد التقرير" : "Generate"}</span> <span>⚡</span>
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 p-2.5 rounded-lg transition-colors" title={isAR ? "طباعة PDF" : "Print PDF"}>
                🖨️
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
