'use client'

import React from 'react'

export default function SandGlassAnimation({ isRunning = true }: { isRunning?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-28 h-40 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl pointer-events-none animate-pulse"></div>

        {/* SVG Hourglass */}
        <svg
          viewBox="0 0 100 140"
          className="w-24 h-36 drop-shadow-[0_10px_20px_rgba(245,158,11,0.25)]"
        >
          <defs>
            {/* Glass gradient */}
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="70%" stopColor="#1e3a8a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
            </linearGradient>

            {/* Sand golden gradient */}
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Clip path for Top Bulb */}
            <clipPath id="topBulbClip">
              <path d="M 22 22 C 22 22 22 65 48 70 L 52 70 C 78 65 78 22 78 22 Z" />
            </clipPath>

            {/* Clip path for Bottom Bulb */}
            <clipPath id="bottomBulbClip">
              <path d="M 48 70 C 22 75 22 118 22 118 L 78 118 C 78 118 78 75 52 70 Z" />
            </clipPath>

            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Wooden / Metallic Top & Bottom caps */}
          <rect x="15" y="12" width="70" height="7" rx="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
          <rect x="18" y="19" width="64" height="3" rx="1.5" fill="#cbd5e1" />
          
          <rect x="18" y="118" width="64" height="3" rx="1.5" fill="#cbd5e1" />
          <rect x="15" y="121" width="70" height="7" rx="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />

          {/* Pillars on sides */}
          <line x1="20" y1="19" x2="20" y2="121" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <line x1="80" y1="19" x2="80" y2="121" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

          {/* Glass Outer Contour */}
          <path
            d="M 22 22 C 22 22 22 66 48 70 C 22 74 22 118 22 118 L 78 118 C 78 118 78 74 52 70 C 78 66 78 22 78 22 Z"
            fill="url(#glassGrad)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
          />

          {/* TOP BULB SAND (Depleting slowly) */}
          <g clipPath="url(#topBulbClip)">
            <ellipse cx="50" cy="48" rx="24" ry="16" fill="url(#sandGrad)" />
            <path
              d="M 24 38 Q 50 44 76 38 L 76 70 L 24 70 Z"
              fill="url(#sandGrad)"
              className="sand-top-level"
            />
            {/* Sand surface funnel */}
            <ellipse cx="50" cy="38" rx="26" ry="6" fill="#fde68a" opacity="0.8" />
          </g>

          {/* FALLING SAND STREAM */}
          {isRunning && (
            <g filter="url(#glow)">
              {/* Continuous stream */}
              <line
                x1="50"
                y1="68"
                x2="50"
                y2="114"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                className="falling-stream"
              />
              
              {/* Extra falling particles */}
              <circle cx="50" cy="80" r="1.5" fill="#fef08a" className="sand-particle-1" />
              <circle cx="50" cy="95" r="1.8" fill="#fef08a" className="sand-particle-2" />
              <circle cx="50" cy="108" r="1.4" fill="#fffbeb" className="sand-particle-3" />
            </g>
          )}

          {/* BOTTOM BULB SAND (Accumulating mound) */}
          <g clipPath="url(#bottomBulbClip)">
            {/* Growing sand pile */}
            <path
              d="M 24 118 Q 50 88 76 118 Z"
              fill="url(#sandGrad)"
              className="sand-bottom-pile"
            />
            {/* Soft highlight on peak */}
            <ellipse cx="50" cy="108" rx="14" ry="4" fill="#fde68a" opacity="0.6" />
          </g>

          {/* Glass reflection highlight */}
          <path
            d="M 28 26 C 26 38 28 56 38 65"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 28 114 C 26 102 28 84 38 75"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-300 mt-2 flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Waiting for Quiz Start Time
      </p>

      {/* Embedded CSS Animations */}
      <style jsx>{`
        .falling-stream {
          animation: sandStream 0.4s linear infinite;
        }

        .sand-particle-1 {
          animation: dropParticle 0.7s linear infinite;
        }

        .sand-particle-2 {
          animation: dropParticle 0.9s linear infinite 0.25s;
        }

        .sand-particle-3 {
          animation: dropParticle 0.6s linear infinite 0.4s;
        }

        .sand-bottom-pile {
          animation: sandMound 3s ease-in-out infinite alternate;
        }

        @keyframes sandStream {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 6;
          }
        }

        @keyframes dropParticle {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(25px);
            opacity: 0;
          }
        }

        @keyframes sandMound {
          0% {
            d: path("M 24 118 Q 50 94 76 118 Z");
          }
          100% {
            d: path("M 24 118 Q 50 88 76 118 Z");
          }
        }
      `}</style>
    </div>
  )
}
