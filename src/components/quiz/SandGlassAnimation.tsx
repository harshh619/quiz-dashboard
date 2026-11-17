'use client'

import React, { useState, useEffect } from 'react'

const FRAMES = [
  '/hourglass-frames/frame_01.png',
  '/hourglass-frames/frame_02.png',
  '/hourglass-frames/frame_03.png',
  '/hourglass-frames/frame_04.png',
  '/hourglass-frames/frame_05.png',
  '/hourglass-frames/frame_06.png',
  '/hourglass-frames/frame_07.png',
  '/hourglass-frames/frame_08.png',
  '/hourglass-frames/frame_09.png',
  '/hourglass-frames/frame_10.png',
  '/hourglass-frames/frame_11.png',
  '/hourglass-frames/frame_12.png',
  '/hourglass-frames/frame_13.png',
  '/hourglass-frames/frame_14.png',
]

export default function SandGlassAnimation({ isRunning = true }: { isRunning?: boolean }) {
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    if (!isRunning) return
    // Preload images into memory for lightning fast rendering
    FRAMES.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAMES.length)
    }, 85) // ~12 fps smooth loop

    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <div className="flex flex-col items-center justify-center py-3 select-none">
      <div className="relative w-36 h-44 flex items-center justify-center">
        {/* Ambient Warm Golden Glow */}
        <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

        {/* Dynamic Hour Glass Frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FRAMES[frameIndex]}
          alt="Hourglass Animation"
          width={148}
          height={194}
          className="relative z-10 w-28 h-auto object-contain drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)] transition-transform duration-75"
        />
      </div>

      <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 backdrop-blur-xs">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300">
          Waiting Room · Time Remaining
        </span>
      </div>
    </div>
  )
}
