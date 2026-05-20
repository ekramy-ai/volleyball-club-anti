// features/video/VideoAnalysis.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/AuthContext";

export default function VideoAnalysis() {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const { profile } = useAuth();

  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("demo");
  const [videoSrc, setVideoSrc] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [newTagText, setNewTagText] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef(null);
  const fileRef = useRef(null);

  // Load matches from Supabase
  useEffect(() => {
    if (!profile?.club_id) return;
    async function loadMatches() {
      try {
        const { data } = await supabase
          .from("matches")
          .select("*, opponents(name), teams(name)")
          .eq("club_id", profile.club_id)
          .order("match_date", { ascending: false });
        setMatches(data || []);
      } catch (err) {
        console.error("Error loading matches:", err);
      }
    }
    loadMatches();
  }, [profile]);

  // Load tags from localStorage when selectedMatchId changes
  useEffect(() => {
    const saved = localStorage.getItem(`xura-video-tags-${selectedMatchId}`);
    if (saved) {
      setTags(JSON.parse(saved));
    } else if (selectedMatchId === "demo") {
      // Seed default demo tags
      const demoTags = [
        { id: "t1", time: 2, text: isAR ? "إرسال ساحق مميز من لاعب #10" : "Ace Serve by Player #10" },
        { id: "t2", time: 6, text: isAR ? "استقبال مثالي من الليبرو" : "Perfect Reception by Libero" },
        { id: "t3", time: 9, text: isAR ? "ضربة ساحقة ناجحة في المنطقة 4" : "Spike Winner in Zone 4" },
        { id: "t4", time: 11, text: isAR ? "حائط صد ثلاثي ناجح للأهلي" : "Triple Block Point by Al-Ahly" },
        { id: "t5", time: 14, text: isAR ? "إنقاذ رائع ودفاع خلفي من منطقة 5" : "Incredible Dig in Zone 5" },
      ];
      setTags(demoTags);
    } else {
      setTags([]);
    }

    if (selectedMatchId === "demo") {
      // Standard public sample video for demonstration
      setVideoSrc("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
      setVideoTitle(isAR ? "مباراة تجريبية - الأهلي ضد الزمالك" : "Demo Match - Al-Ahly vs Zamalek");
    } else {
      setVideoSrc("");
      setVideoTitle("");
    }
  }, [selectedMatchId, isAR]);

  // Save tags to localStorage
  const saveTags = (updatedTags) => {
    setTags(updatedTags);
    localStorage.setItem(`xura-video-tags-${selectedMatchId}`, JSON.stringify(updatedTags));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoTitle(file.name);
      if (selectedMatchId === "demo") {
        setSelectedMatchId("custom");
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTagText.trim() || !videoRef.current) return;

    const time = Math.round(videoRef.current.currentTime);
    const newTag = {
      id: `tag-${Date.now()}`,
      time,
      text: newTagText.trim(),
    };

    const updated = [...tags, newTag].sort((a, b) => a.time - b.time);
    saveTags(updated);
    setNewTagText("");
  };

  const handleDeleteTag = (id) => {
    const updated = tags.filter((t) => t.id !== id);
    saveTags(updated);
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>🎬</span> {t("video_title")}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{t("video_subtitle")}</p>
        </div>

        {/* Video source select */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="bg-gray-950 border border-gray-800 text-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:border-red-500 outline-none"
          >
            <option value="demo">🎮 {isAR ? "الفيديو التجريبي التفاعلي" : "Interactive Demo Video"}</option>
            <option value="custom">📁 {isAR ? "ملف فيديو محلي" : "Local Video File"}</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                🏐 {m.teams?.name} vs {m.opponents?.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fileRef.current?.click()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 shadow-md shadow-red-900/10"
          >
            <span>📤</span> {isAR ? "رفع فيديو محلي" : "Upload Local"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Player & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Title Bar */}
            <div className="bg-gray-950 px-5 py-3 border-b border-gray-800 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-300 truncate max-w-xs md:max-w-md">
                🎥 {videoTitle || (isAR ? "لا يوجد فيديو محمل" : "No video loaded")}
              </span>
              {duration > 0 && (
                <span className="text-[10px] bg-red-950 text-red-400 font-mono font-bold px-2 py-0.5 rounded border border-red-900/40">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>

            {/* Video Container */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                  <span className="text-5xl mb-4">🎬</span>
                  <p className="text-sm font-bold text-gray-300 mb-1">{isAR ? "الرجاء اختيار مصدر فيديو" : "Please select a video source"}</p>
                  <p className="text-xs text-gray-500 max-w-xs">{isAR ? "اختر الفيديو التجريبي أو ارفع فيديو مباراة محلي لبدء التحليل الفني والترميز." : "Choose the interactive demo video or upload a local file to start coding timelines."}</p>
                  <button onClick={() => setSelectedMatchId("demo")} className="btn-primary text-xs px-5 py-2 mt-4">
                    {isAR ? "تحميل الفيديو التجريبي" : "Load Demo Video"}
                  </button>
                </div>
              )}
            </div>

            {/* Timeline Visual Tagger (shows interactive dot markers) */}
            {videoSrc && duration > 0 && (
              <div className="bg-gray-950 p-4 border-t border-gray-800 space-y-2">
                <div className="flex justify-between text-[10px] text-gray-500 font-mono font-bold">
                  <span>0:00</span>
                  <span>{formatTime(duration)}</span>
                </div>
                
                {/* Progress bar container for markers */}
                <div className="relative h-6 bg-gray-900 border border-gray-800 rounded-lg flex items-center overflow-visible">
                  {/* Current timeline position tracker */}
                  <div 
                    className="absolute top-0 bottom-0 bg-red-600/20 pointer-events-none transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />

                  {/* Marker dots */}
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSeek(t.time)}
                      className="absolute group z-10 w-3 h-3 -ml-1.5 bg-yellow-500 hover:bg-red-500 hover:scale-125 border border-black rounded-full transition-all cursor-pointer shadow-lg"
                      style={{ left: `${(t.time / duration) * 100}%` }}
                      title={`${formatTime(t.time)} - ${t.text}`}
                    >
                      {/* Tooltip on hover */}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 border border-gray-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap z-30 shadow-2xl">
                        <span className="text-yellow-400 mr-1">[{formatTime(t.time)}]</span> {t.text}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 text-center italic">{isAR ? "انقر على النقاط الصفراء بالخط الزمني للقفز المباشر للحدث" : "Click on the yellow markers on the timeline bar to jump directly to highlights."}</p>
              </div>
            )}
          </div>

          {/* Add Tag form */}
          {videoSrc && (
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl shadow">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                <span>🏷️</span> {isAR ? "تسجيل لقطة في الوقت الحالي" : "Tag Highlight at Current Time"}
              </h3>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  placeholder={isAR ? "مثال: ضربة ساحقة ناجحة من مركز 4..." : "e.g. Block Point, Serve Error..."}
                  className="flex-1 bg-gray-950 border border-gray-800 text-gray-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!newTagText.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏱️ {isAR ? "تسجيل [ " + formatTime(currentTime) + " ]" : `Tag [ ${formatTime(currentTime)} ]`}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Tags list */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col min-h-[400px]">
          <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>🏷️</span> {t("video_tags")} ({tags.length})
            </span>
            {tags.length > 0 && (
              <button
                onClick={() => saveTags([])}
                className="text-[10px] text-gray-500 hover:text-red-400 uppercase tracking-widest font-bold"
              >
                🗑️ {isAR ? "مسح الكل" : "Clear All"}
              </button>
            )}
          </h2>

          {tags.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
              <span className="text-3xl mb-3">🏷️</span>
              <p className="text-xs font-bold text-gray-300">{isAR ? "لا توجد علامات مسجلة بعد" : "No tagged highlights yet"}</p>
              <p className="text-[10px] text-gray-500 max-w-xs mt-1">{isAR ? "قم بتشغيل الفيديو واكتب أحداث الرصد لتسجيل اللقطات والوصول السريع إليها." : "Play the video and write tags to quickly access match highlights."}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[430px]">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className="bg-gray-950 border border-gray-800 hover:border-gray-700 rounded-xl p-3 flex items-center justify-between group transition-colors"
                >
                  <button
                    onClick={() => handleSeek(t.time)}
                    className="flex-1 flex items-start gap-3 text-left"
                  >
                    <span className="bg-red-950 text-red-500 font-mono text-xs font-black px-2 py-1 rounded border border-red-900/30 shrink-0">
                      {formatTime(t.time)}
                    </span>
                    <span className="text-xs font-semibold text-gray-200 leading-normal hover:text-red-500 transition-colors">
                      {t.text}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteTag(t.id)}
                    className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all ml-2"
                    title={isAR ? "حذف العلامة" : "Delete Tag"}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
