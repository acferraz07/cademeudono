'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  PawPrint,
  Megaphone,
  Tag,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  Sparkles,
  SearchX,
  Search,
  Star,
  Home as HomeIcon,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/pets', icon: PawPrint, label: 'Meus Pets' },
  { href: '/announcements', icon: Megaphone, label: 'Anúncios' },
]

const communityItems = [
  { href: '/adocao', icon: Heart, label: 'Adoção' },
  { href: '/adocao/minhas', icon: ClipboardList, label: 'Minhas Adoções' },
  { href: '/petmatch', icon: Sparkles, label: 'PetMatch' },
  { href: '/perdidos', icon: SearchX, label: 'Perdidos' },
  { href: '/encontrados', icon: Search, label: 'Encontrados' },
  { href: '/devolvidos', icon: Star, label: 'Devolvidos' },
  { href: '/lar-temporario', icon: HomeIcon, label: 'Lar Temporário' },
]

const accountItems = [
  { href: '/tags', icon: Tag, label: 'Smart Tags' },
  { href: '/profile', icon: User, label: 'Meu Perfil' },
]

function NavLink({ href, icon: Icon, label }: (typeof navItems)[number]) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <div className="relative w-8 h-8 shrink-0">
          <Image src="/logo.png" alt="Cadê Meu Dono" fill className="object-contain" />
        </div>
        <span className="font-bold text-gray-900 text-base">Cadê Meu Dono</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-4 pb-1">
          Comunidade
        </p>
        {communityItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-4 pb-1">
          Minha conta
        </p>
        {accountItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">
              {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 hidden lg:flex flex-col z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile slide-in sidebar ── */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 flex flex-col z-50 lg:hidden',
          'transform transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
        >
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Mobile top header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center px-4 z-20">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-gray-100 -ml-2"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="relative w-6 h-6 shrink-0">
            <Image src="/logo.png" alt="Cadê Meu Dono" fill className="object-contain" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Cadê Meu Dono</span>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="lg:ml-60 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
