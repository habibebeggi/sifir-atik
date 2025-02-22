"use client";

import { User, Loader } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getUserByEmail } from "@/utils/db/actions";
import { getAllRewards, getUserBalance } from "@/utils/db/actions";

type UserInfo = {
  id: number;
  name: string;
  email: string;
  totalPoints: number;
  balance: number;
  level: number; 
  avatar: string | null; 
};

export default function UserProfileCard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUserAndRewards = async () => {
      setLoading(true);
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail);
          if (fetchedUser) {
            const rewards = await getAllRewards(); 
            const userRewards = rewards.filter(
              (reward) => reward.userId === fetchedUser.id
            );
            const totalPoints = userRewards.reduce(
              (acc, reward) => acc + reward.points,
              0
            );
            
            const balance = await getUserBalance(fetchedUser.id);
            const level = userRewards.length > 0 ? userRewards[0].level : 1; 

            setUser({
              id: fetchedUser.id,
              name: fetchedUser.name,
              email: fetchedUser.email,
              totalPoints, 
              balance, 
              level, 
              avatar: fetchedUser.avatar, 
            });
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

    fetchUserAndRewards();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-gray-200 bg-opacity-50 z-50">
        <div className="flex justify-center items-center">
          <Loader className="animate-spin h-16 w-16 text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 justify-start">
      <Card className="flex flex-col max-w-lg mx-auto text-slate-900">
        <CardHeader className="text-left text-xl mt-4">
          <div className="flex items-center justify-center">
            <CardTitle className="font-bold text-gray-800  ">
             Profilim
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-1/3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="h-24 w-24 rounded-full object-cover mb-2"
                />
              ) : (
                <User className="h-24 w-24 text-blue-500 mb-2" />
              )}
            </div>
            <div className="w-2/3 pl-4 pr-2 flex flex-col justify-center">
              <div className="flex justify-between mb-2 items-center">
                <p className="text-lg  text-gray-900">
                  {user?.name}
                </p>
              </div>
              <div className="flex mb-2 items-center">
                <p className="text-lg  mr-1 text-gray-950">Seviye:</p>
                <p className="text-lg  mr-2"> Level {user?.level} </p>
              </div>
              <div className="flex justify-between mb-2 items-center">
                <p className="text-md font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mb-5"></CardFooter>
      </Card>
    </div>
  );
}
