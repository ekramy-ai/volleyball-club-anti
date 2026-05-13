// features/video/VideoAnalysis.jsx
import React, { useState, useRef } from "react";

export default function VideoAnalysis() {
  const [videoSrc, setVideoSrc] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setVideoSrc(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Video Analysis</h1>
        <p className="text-gray-400 text-sm mt-0.5">Upload and analyze match videos with tagging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player */}
        <div className="card lg:col-span-2">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: 420 }}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-red-500 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-5xl mb-4">🎬</div>
              <p className="text-gray-300 font-medium mb-1">Upload match video</p>
              <p className="text-gray-500 text-sm">MP4, MOV, AVI supported</p>
              <button className="btn-primary mt-5 text-sm">Choose File</button>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          )}
        </div>

        {/* Tag panel */}
        <div className="card space-y-3">
          <h2 className="text-base font-semibold text-white">Tags</h2>
          <p className="text-gray-400 text-sm">
            Tags will appear here after you load a video and start coding events.
          </p>
          {videoSrc && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-3xl mb-2">🏷️</div>
              <p className="text-gray-500 text-xs">No tags yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
