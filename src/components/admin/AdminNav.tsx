'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, HelpCircle, Trophy,
  Award, Mail, ArrowLeft, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Competitions', href: '/admin/competitions', icon: Calendar },
    { label: 'Participants', href: '/admin/participants', icon: Users },
    { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle },
    { label: 'Results & Ranks', href: '/admin/results', icon: Trophy },
    { label: 'Certificates & Signatures', href: '/admin/certificates', icon: Award },
    { label: 'Email Queue', href: '/admin/emails', icon: Mail },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="AMR 2026 Logo"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="font-bold text-sm tracking-tight hidden sm:inline">
                Admin Control Center
              </span>
            </Link>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Participant View</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

      </div>
    </header>
  )
}
