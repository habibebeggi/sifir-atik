'use client'

import { useState, useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"

import { Toaster } from 'react-hot-toast'
import { getAvailableRewards, getUserByEmail } from '@/utils/db/actions'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedUserEmail = localStorage.getItem("userEmail");

    if (storedUserEmail) {
      setIsLoggedIn(true);
      setUserEmail(storedUserEmail);
      setSidebarOpen(true); 
    } else {
      setIsLoggedIn(false);
      setSidebarOpen(false); 
    }

 
    const fetchTotalEarnings = async () => {
      try {
        if (storedUserEmail) {
          const user = await getUserByEmail(storedUserEmail);
          if (user) {
            const availableRewards = await getAvailableRewards(user.id) as any;
            setTotalEarnings(availableRewards);
          }
        }
      } catch (error) {
        console.error("Toplam kazanç alınırken hata oluştu:", error);
      }
    };

    fetchTotalEarnings();
  }, []);

  const login = (email: string) => {
    localStorage.setItem("userEmail", email);
    setIsLoggedIn(true);
    setUserEmail(email);
    setSidebarOpen(true);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setUserEmail(null);
    setSidebarOpen(false);
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />
          <div className="flex flex-1">
            {isLoggedIn && sidebarOpen && <Sidebar open={sidebarOpen} onLogout={logout} />}
            <main
              className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${
                isLoggedIn ? (sidebarOpen ? "lg:ml-64" : "w-full") : "w-full flex justify-center"
              }`}
            >
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}