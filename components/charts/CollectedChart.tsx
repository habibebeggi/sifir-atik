"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getUserByEmail, getCollectedWastesByCollector} from "@/utils/db/actions";
import { BasicChart } from "./BasicChart";
import { Coins, Trash, Trash2, Trash2Icon } from "lucide-react";

type Waste = {
  id: number;
  status: string;
  collectorId: number;
  reportId: number;
  collectionDate: Date;
};

export default function CollectedChart() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const [collectedWastes, setCollectedWastes] = useState<Waste[]>([]);

  useEffect(() => {
    const fetchUserAndWastes = async () => {
      setLoading(true);
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            setUser(fetchedUser);

            const fetchedWastes = await getCollectedWastesByCollector(
              fetchedUser.id
            );

            if (fetchedWastes && fetchedWastes.length > 0) {
              setCollectedWastes(fetchedWastes);
            } else {
              toast.error("Toplanan atık bilgileri alınamadı!");
            }
          } else {
            toast.error("Kullanıcı bilgileri alınamadı!");
          }
        } else {
          toast.error("Kullanıcı e-posta bilgisi bulunamadı!");
        }
      } catch (error) {
        console.error("Hata:", error);
        toast.error("Bir hata oluştu!");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndWastes();
  }, []);

  return (
    <div className="space-y-4 justify-start">
      <BasicChart
        title="Toplanan Atık Sayısı"
        value={collectedWastes.length} 
         iconColor="text-green-600"
        icon={Trash2} 
      />
    </div>
  );
}
