'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Earth, Leaf, Recycle, Users, HandCoins, MapPin, ChevronRight, Trees } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions'
const poppins = Poppins({ 
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  display: 'swap',
})

function AnimatedCircle() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-green-300 opacity-40 animate-ping"></div>
      <div className="absolute inset-4 rounded-full bg-green-200 opacity-60 animate-spin"></div>
      <div className="absolute inset-6 rounded-full bg-green-100 opacity-80 animate-bounce"></div>
      <Earth className="absolute inset-0 m-auto h-16 w-16 text-green-600 animate-pulse" />
    </div>
  )
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  useEffect(() => {
    async function fetchImpactData() {
      try {
        
        const reports = await getRecentReports(100) || [];  
        const rewards = await getAllRewards();
        const tasks = await getWasteCollectionTasks(100);  

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
        const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
        const co2Offset = wasteCollected * 0.5;  

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10, 
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10 
        });
      } catch (error) {
        console.error("Error fetching impact data:", error);
        
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0
        });
      }
    }

    fetchImpactData();
  }, []);

  const login = () => {
    setLoggedIn(true);
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${poppins.className}`}>
      <section className="text-center mb-20">
        <AnimatedCircle />
        <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">
          Sıfır Atık 
          <div className='text-green-600 text-4xl mt-4'>
            Çevre Dostu Atık Yönetim Sistemi
          </div>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Daha temiz bir çevre ve sürdürülebilir bir gelecek için sen de atık bildirerek ya da toplayarak geleceğe güzel bir iz bırakmak ister misin?
        </p>
        {!loggedIn ? (
          <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
            Haydi Başlayalım
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Link href="/report">
            <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
              Atık Bildir
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        )}
      </section>
      
      <section className="grid md:grid-cols-3 gap-10 mb-20">
        <FeatureCard
          icon={Trees}
          title="Çevre Dostu"
          description="Daha temiz bir çevre, daha sağlıklı yarınlar için sen de sıfır atıkla işe başla! "
        />
        <FeatureCard
          icon={HandCoins}
          title="Ödül Tabanlı"
          description="Atık bildirerek ve toplayarak puan/ödül kazanabilir, kazandığın ödülleri kupon koduna dönüştürerek dilediğin gibi kulanabilirsin."
        />
        <FeatureCard
          icon={Users}
          title="Topluluk Odaklı"
          description="Daha temiz bir çevre ve sürdürülebilir gelecek için sen de aramıza katıl."
        />
      </section>
      
      <section className="bg-white p-10 rounded-3xl shadow-lg mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">Çevreye Katkılarımız</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <ImpactCard title="Toplanan Atık Miktarı" value={`${impactData.wasteCollected} kg`} icon={Recycle} />
          <ImpactCard title="Bidirilen Atık Sayısı" value={impactData.reportsSubmitted.toString()} icon={MapPin} />
          <ImpactCard title="Kazanılan Puan" value={impactData.tokensEarned.toString()} icon={HandCoins} />
          <ImpactCard title="Sera Gazı Tasarrufu" value={`${impactData.co2Offset} lt`} icon={Leaf} />
        </div>
      </section>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;
  
  return (
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl hover: bg-gary-100">
      <Icon className="h-10 w-10 text-green-500 mb-4" />
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-950 items-center" />
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-center">{description}</p>
    </div>
  )
}
