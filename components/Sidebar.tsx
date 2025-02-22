//@ts-nocheck
'use client'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { PackagePlus, Trash2, Coins, Medal, Settings, Home, MessagesSquare, Send, PersonStanding, InfoIcon, Delete, User, Map, MapPin, OctagonX } from "lucide-react"

const sidebarItems = [
  { href: "/", icon: Home, label: "Anasayfa" },
  { href: "/report", icon: PackagePlus, label: "Atık Bildir" },
  { href: "/collect", icon: Trash2, label: "Atık Topla" },
  {href:"/stations", icon: MapPin, label: "ATM' ler"},
  { href: "/rewards", icon: Coins, label: "Ödüller" },
  { href: "/leaderboard", icon: Medal, label: "Liderlik Tablosu" },
  {href:"/profile", icon: User, label: "Profilim"},
  {href:"/settings", icon: Settings, label: "Ayarlar"},
  {href:"/deleteAccount", icon: OctagonX, label: "Hesabımı Sil"},
 
  
]

interface SidebarProps {
  open: boolean;
  onLogout: () => void;
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`bg-white border-r pt-20 border-gray-100 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 `}>
      <nav className="h-full flex flex-col justify-between">
        <div className="px-6 py-10 space-y-8">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button 
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={`w-full justify-start py-10 ${
                  pathname === item.href 
                    ? "bg-green-100 text-green-800" 
                    : "text-gray-600 hover:bg-gray-100"
                }`} 
              >
                <item.icon className="mr-5" style={{ width: '20px', height: '20px' }} />
                <span className="text-base">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
        
      </nav>
    </aside>
  )
}