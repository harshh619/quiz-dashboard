'use client'

import React from 'react'

export default function SandGlassAnimation({ isRunning = true }: { isRunning?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 select-none">
      <div
        className={`relative w-32 h-40 sm:w-36 sm:h-44 flex items-center justify-center ${
          isRunning ? '' : 'hg-paused'
        }`}
      >
        {/* Ambient Warm Golden Glow */}
        <div className="absolute inset-2 bg-amber-400/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* 60fps Seamless Rotating Hourglass SVG */}
        <div className="hg-flip relative z-10 flex items-center justify-center drop-shadow-[0_12px_24px_rgba(245,158,11,0.32)]">
          <svg
            viewBox="0 0 140 190"
            className="w-24 sm:w-28 h-auto overflow-visible"
            role="img"
            aria-label="Animated hourglass countdown"
          >
            <defs>
              {/* Symmetric Upper & Lower Glass Bulb Clip Paths (mirror across y = 95) */}
              <clipPath id="hg-top-bulb">
                <path d="M 31 23 C 31 61, 54 83, 66.5 94.5 L 73.5 94.5 C 86 83, 109 61, 109 23 Z" />
              </clipPath>
              <clipPath id="hg-bottom-bulb">
                <path d="M 66.5 95.5 C 54 107, 31 129, 31 167 L 109 167 C 109 129, 86 107, 73.5 95.5 Z" />
              </clipPath>

              {/* Metallic Dark Cap Gradient */}
              <linearGradient id="hg-cap-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="45%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              {/* Warm Gold Trim Gradient */}
              <linearGradient id="hg-gold-trim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>

              {/* Crystal Glass Fill */}
              <linearGradient id="hg-glass-fill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#f0f9ff" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.95" />
              </linearGradient>

              {/* Golden Sand Gradient */}
              <linearGradient id="hg-sand-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="55%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            {/* Side Pillars (subtle metallic gold rods) */}
            <rect x="23" y="21" width="3" height="148" rx="1.5" fill="url(#hg-gold-trim)" opacity="0.55" />
            <rect x="114" y="21" width="3" height="148" rx="1.5" fill="url(#hg-gold-trim)" opacity="0.55" />

            {/* Glass Body Fill */}
            <path
              d="M 30 22 C 30 62, 54 84, 66 95 C 54 106, 30 128, 30 168 L 110 168 C 110 128, 86 106, 74 95 C 86 84, 110 62, 110 22 Z"
              fill="url(#hg-glass-fill)"
            />

            {/* Top Bulb Sand (drains smoothly from y=42 down to y=95) */}
            <g clipPath="url(#hg-top-bulb)">
              <path
                className="hg-top-sand"
                d="M 24 42 Q 70 46 116 42 L 116 97 L 24 97 Z"
                fill="url(#hg-sand-grad)"
              />
            </g>

            {/* Bottom Bulb Sand (rises into mound, then settles into neck on 180deg flip) */}
            <g clipPath="url(#hg-bottom-bulb)">
              {/* Falling Golden Sand Stream */}
              <line
                x1="70"
                y1="94"
                x2="70"
                y2="168"
                stroke="#f59e0b"
                strokeWidth="2.6"
                strokeLinecap="round"
                className="hg-stream"
              />
              {/* Animated Sparkling Grains Falling */}
              <line
                x1="70"
                y1="94"
                x2="70"
                y2="168"
                stroke="#fef3c7"
                strokeWidth="1.6"
                strokeDasharray="3 9"
                strokeLinecap="round"
                className="hg-grains"
              />
              {/* Rising Golden Sand Pile */}
              <path
                className="hg-bottom-sand"
                d="M 24 118 Q 70 108 116 118 L 116 170 L 24 170 Z"
                fill="url(#hg-sand-grad)"
              />
            </g>

            {/* Glass Specular Reflections (symmetric across center) */}
            <path
              d="M 38 30 C 39 56, 52 74, 62 86"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M 38 160 C 39 134, 52 116, 62 104"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.55"
            />

            {/* Glass Outline */}
            <path
              d="M 30 22 C 30 62, 54 84, 66 95 C 54 106, 30 128, 30 168 L 110 168 C 110 128, 86 106, 74 95 C 86 84, 110 62, 110 22 Z"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />

            {/* Top Cap + Gold Accent Rim */}
            <rect x="24" y="20" width="92" height="3" rx="1.5" fill="url(#hg-gold-trim)" />
            <rect x="16" y="7" width="108" height="14" rx="7" fill="url(#hg-cap-grad)" stroke="#475569" strokeWidth="1" />

            {/* Bottom Cap + Gold Accent Rim */}
            <rect x="24" y="167" width="92" height="3" rx="1.5" fill="url(#hg-gold-trim)" />
            <rect x="16" y="169" width="108" height="14" rx="7" fill="url(#hg-cap-grad)" stroke="#475569" strokeWidth="1" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 backdrop-blur-xs">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300">
          Waiting Room · Time Remaining
        </span>
      </div>
    </div>
  )
}
