// features/video/VideoAnalysis.jsx
import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function VideoAnalysis() {
  const { t } = useTranslation();
  const [videoSrc, setVideoSrc] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setVideoSrc(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("video_title")}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t("video_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          {videoSrc ? (
            <video src={videoSrc} controls className="w-full rounded-lg bg-black" style={{ maxHeight: 420 }} />
          ) : (
            <div
              className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-red-500 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-5xl mb-4">🎬</div>
              <p className="text-gray-300 font-medium mb-1">{t("video_upload")}</p>
              <p className="text-gray-500 text-sm">{t("video_upload_sub")}</p>
              <button className="btn-primary mt-5 text-sm">{t("video_choose")}</button>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="text-base font-semibold text-white">{t("video_tags")}</h2>
          <p className="text-gray-400 text-sm">{t("video_tags_sub")}</p>
          {videoSrc && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-3xl mb-2">🏷️</div>
              <p className="text-gray-500 text-xs">{t("video_no_tags")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
