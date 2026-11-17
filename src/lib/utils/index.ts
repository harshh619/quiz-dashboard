import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format seconds → MM:SS
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Generate unique registration number: AMR-WAAW-2026-XXXXXX
export function generateRegistrationNumber(sequence: number): string {
  const year = new Date().getFullYear()
  return `AMR-WAAW-${year}-${String(sequence).padStart(6, '0')}`
}

// Generate certificate number: CERT-AMR-2026-XXXXXX
export function generateCertificateNumber(sequence: number): string {
  const year = new Date().getFullYear()
  return `CERT-AMR-${year}-${String(sequence).padStart(6, '0')}`
}

// Get server time remaining (in seconds) for a quiz
export function getServerTimeRemaining(
  scheduledStart: string,
  scheduledEnd: string
): number {
  const now = Date.now()
  const end = new Date(scheduledEnd).getTime()
  const remaining = Math.floor((end - now) / 1000)
  return Math.max(0, remaining)
}

// Check if quiz is currently active
export function isQuizActive(start: string, end: string): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now < new Date(end).getTime()
}

// Check if waiting room is open (15 mins before start)
export function isWaitingRoomOpen(start: string): boolean {
  const now = Date.now()
  const startTime = new Date(start).getTime()
  const waitingRoomOpen = startTime - 15 * 60 * 1000
  return now >= waitingRoomOpen && now < startTime
}

// Shuffle array (Fisher-Yates) - for randomizing options
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Format date to readable string
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  })
}
