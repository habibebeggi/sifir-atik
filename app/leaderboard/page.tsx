"use client"
import { useState, useEffect } from "react"
import { getAllRewards, getUserByEmail } from "@/utils/db/actions"
import { Loader, Award, User, Trophy } from "lucide-react"
import { toast } from "react-hot-toast"

type Reward = {
    id: number,
    userId: number,
    points: number,
    level: number,
    createdAt: Date,
    userName: string | null
}

export default function LeaderboardPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);

    useEffect(() => {
        const fetchRewardsAndUser = async () => {
            setLoading(true);
            try {
                const fetchedRewards = await getAllRewards();
                console.log("Fetched Rewards:", fetchedRewards); 
                const filteredRewards = fetchedRewards; 
                console.log("Filtered Rewards:", filteredRewards); 

                const userRewardsMap = new Map<number, { totalPoints: number; userName: string | null }>(); 
                const rewardIdsMap = new Map<number, Reward>(); 

                filteredRewards.forEach((reward) => {
                    console.log(`Reward ID: ${reward.id}, Points: ${reward.points}, User ID: ${reward.userId}`); 
                    const currentUser = userRewardsMap.get(reward.userId);
                    if (currentUser) {
                        currentUser.totalPoints += reward.points; 
                    } else {
                        userRewardsMap.set(reward.userId, { totalPoints: reward.points, userName: reward.userName });
                    }

                    if (!rewardIdsMap.has(reward.userId) || rewardIdsMap.get(reward.userId)!.points < reward.points) {
                        rewardIdsMap.set(reward.userId, reward);
                    }
                });

                const uniqueRewards = Array.from(userRewardsMap.entries()).map(([userId, { totalPoints, userName }]) => {
                    const reward = rewardIdsMap.get(userId);
                    return reward ? {
                        id: reward.id,
                        userId: reward.userId,
                        points: totalPoints, 
                        level: reward.level,
                        createdAt: reward.createdAt,
                        userName: userName
                    } : null;
                }).filter((reward): reward is Reward => reward !== null);

                console.log("Unique Rewards:", uniqueRewards); 

                uniqueRewards.sort((a, b) => b.points - a.points); 
                setRewards(uniqueRewards);

                const userEmail = localStorage.getItem('userEmail');
                if (userEmail) {
                    const fetchedUser = await getUserByEmail(userEmail);
                    if (fetchedUser) {
                        setUser(fetchedUser);
                    } else {
                        toast.error('Kullanıcı bulunamadı.');
                    }
                } else {
                    toast.error('Lütfen oturum açınız.');
                }
            } catch (error) {
                console.error("Kullanıcı ödülleri alınırken hata oluştu! Hata: ", error);
                toast.error("Liderlik tablosu yüklenirken hata oluştu! Lütfen tekrar deneyiniz.");
            } finally {
                setLoading(false);
            }
        }

        fetchRewardsAndUser()
    }, []);

    return (
        <div className="">
            <div className="max-w-3xl mx-auto">
                <h2> </h2>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="animate-spin h-8 w-8 text-gray-600" />
                    </div>
                ) : (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6">
                            <div className="flex justify-between items-center text-white">
                                <Trophy className="h-10 w-10" />
                                <span className="text-2xl font-bold">Liderlik Tablosu</span>
                                <Trophy className="h-10 w-10" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sıra No.</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplam Puan</th> 
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seviye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rewards.map((reward, index) => (
                                        <tr key={index} className={`${user && user.id === reward.userId ? 'bg-indigo-50' : ''} hover:bg-gray-50 transition-colors duration-150 ease-in-out`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <User className="h-full w-full rounded-full bg-gray-200 text-gray-500 p-2" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{reward.userName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Award className="h-5 w-5 text-indigo-500 mr-2" />
                                                    <div className="text-sm font-semibold text-gray-900">{reward.points}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                    Level {reward.level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
