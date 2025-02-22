import { error } from "console";
import {db} from "./dbConfig";
import {Users, Reports, Rewards, CollectedWastes, Notifications, Transactions, Stations} from "./schema";
import {eq, sql, and, desc, ne, not} from "drizzle-orm";

export async function createUser(email: string, name: string) {
    try {
      const [user] = await db.insert(Users).values({ email, name }).returning().execute();
      return user;
    } catch (error) {
      console.error("Kullanıcı oluşturulamadı! Hata:", error);
      return null;
    }
}
  
  export async function checkIfUserExists(email: string) {
    try {
        const existingUser = await db.select().from(Users).where(eq(Users.email, email)).execute();
        return existingUser.length > 0; 
    } catch (error) {
        console.error("Kullanıcı kontrol edilirken hata oluştu:", error);
        return false;
    }
}

export async function updateUserByEmail(
    email: string,
    { name, phone, avatar }: { name: string; phone: string | null; avatar: string | null }
  ) {
    try {
      const updatedUser = await db
        .update(Users)
        .set({ name, phone, avatar })
        .where(eq(Users.email, email)) 
        .returning(); 
  
      return updatedUser[0]; 
    } catch (error) {
      console.error("Kullanıcı güncellenirken hata oluştu:", error);
      throw new Error("Güncelleme işlemi başarısız oldu.");
    }
}  

export async function getUserByEmail(email:string) {
    try{
        const [user]= await db.select().from(Users).where(eq(Users.email, email)).execute();
        return user;

    } catch( error){
        console.error("Kullanıcı e-postayla alınırken hata oluştu! Hata: ", error);
        return null;
    }
}
export async function deleteUser(email: string) {
    const user = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .limit(1)  
      .execute();
  
    if (user.length === 0) {
      console.error("Kullanıcı bulunamadı.");
      return false; 
    }
  
    const userId = user[0].id;
  
    try {
      await db.delete(CollectedWastes).where(eq(CollectedWastes.collectorId, userId)).execute();
      await db.delete(Reports).where(eq(Reports.userId, userId)).execute();
      await db.delete(Rewards).where(eq(Rewards.userId, userId)).execute();
      await db.delete(Notifications).where(eq(Notifications.userId, userId)).execute();
      await db.delete(Transactions).where(eq(Transactions.userId, userId)).execute();
    
      const deleteUserResult = await db.delete(Users).where(eq(Users.id, userId)).execute();
      if (!deleteUserResult) {
        console.error("Kullanıcı silinemedi.");
        return false; 
      }
  
      console.log("Kullanıcı ve ilişkili tüm veriler başarıyla silindi.");
      return true; 
    } catch (error) {
      console.error("Hesap silme işlemi sırasında hata oluştu: ", error);
      return false; 
    }
}
  
export async function createReport(
    userId: number,
    location: string,
    wasteType: string,
    amount: string,
    imageUrl?: string,
    type?: string,
    verificationResult?: any
) {
    try{
        const numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
        if(isNaN(numericAmount)){
            throw new Error("Geçersiz atık miktarı!");
        }

        const earnedPoints = numericAmount*(numericAmount/100);

        const [report] = await db
        .insert(Reports)
        .values({
            userId,
            location,
            wasteType,
            amount,
            imageUrl,
            verificationResult,
            status: "pending",
        })
        .returning()
        .execute();
        
        await updateRewardPoints(userId, earnedPoints);
        await createTransaction(userId, 'earned_report', earnedPoints, "Atık bildiriminden kazanılan puanlar");
        await createNotification(userId, `Atık bildiriminden ${earnedPoints} puan kazandınız!`, 'Ödül');

        return report;
    } catch(error){
        console.error("Atık bildirilirken hata oluştu! Hata: ", error);
        return null;
    }
}

export async function getReportsByUserId(userId: number) {
    try{
        const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).execute();
        return reports;

    } catch(error){
        console.error("Atık bildirimleri getirilirken hata oluştu! Hata: ",error);
        return [];
    }
}

export async function getUserIdByEmail(email: string): Promise<number | null> {
    try {
      const user = await db
        .select()
        .from(Users)
        .where(eq(Users.email, email)) 
        .execute();
      
      if (user.length > 0) {
        return user[0].id; 
      } else {
        return null; 
      }
    } catch (error) {
      console.error("Kullanıcı ID'si alınırken hata oluştu:", error);
      return null; 
    }
}

export async function getOrCreateReward(userId: number) {
    try{
        let [reward] = await db.select().from(Rewards).where(eq(Rewards.userId, userId)).execute();
        if(!reward) {
            [reward] = await db.insert(Rewards).values({
                userId, 
                name: 'Varsayılan Ödül', 
                collectionInfo: 'Varsayılan Toplama Bilgisi',
                points: 0,
                level: 1,
                isAvailable: true,
            }).returning().execute();
        }
        return reward;

    } catch(error) {
        console.error("Ödül oluşturulurken/getirilirken hata oluştu! Hata: ", error);
        return null;
    }
}

export async function updateRewardPoints(userId: number, pointsToAdd: number) {
    try {
        const currentReward = await db
            .select()
            .from(Rewards)
            .where(eq(Rewards.userId, userId))
            .execute();

        if (!currentReward || currentReward.length === 0) {
            throw new Error("Kullanıcı ödül verisi bulunamadı!");
        }

        const currentPoints = currentReward[0].points;

        const newPoints = currentPoints + pointsToAdd;

        if (currentPoints !== newPoints) {
            const [updatedReward] = await db
                .update(Rewards)
                .set({
                    points: newPoints,
                    updatedAt: new Date(),
                })
                .where(eq(Rewards.userId, userId))
                .returning()
                .execute();

            return updatedReward;
        }

        return currentReward[0];

    } catch (error) {
        console.error("Ödül puanları güncellenirken hata oluştu! Hata:", error);
        return null;
    }
}

export async function createCollectedWaste(reportId: number, collectorId: number, notes?: string) {
    try{
        const [collectedWaste] = await db
        .insert(CollectedWastes)
        .values({
            reportId,
            collectorId,
            collectionDate: new Date(),
        })
        .returning()
        .execute();
        
        return collectedWaste;
    } catch(error) {
        console.error("Toplanan atık bilgileri getirilirken hata oluştu! Hata: ", error);
        return null;
    }
}

export async function getCollectedWastesByCollector(collectorId: number) {
    try{
        
        return await db.select().from(CollectedWastes).where(eq(CollectedWastes.collectorId, collectorId)).execute();
    
    } catch(error){
        console.error("Toplanan atık bilgileri getirilirken hata oluştu! Hata: ", error);
        return [];
    }
}

export async function createNotification(userId: number, message: string, type: string) {
    try {
        const [notification] = await db
        .insert(Notifications)
        .values({userId, message, type})
        .returning()
        .execute();
        return notification;
    } catch(error) {
        console.error("Okunmamış bildirimler alınırken hata oluştu! Hata: ", error);
        return [];
    }
}

export async function getUnreadNotifications(userId: number) {
    try {
      return await db.select().from(Notifications).where(
        and(
          eq(Notifications.userId, userId),
          eq(Notifications.isRead, false)
        )
      ).execute();
    } catch (error) {
      console.error("Okunmamış bildirimler alınırken hata oluştu! Hata:", error);
      return [];
    }
}

export async function markNotificationAsRead(notificationId: number) {
    try{
        await db.update(Notifications).set({isRead: true}).where(eq(Notifications.id, notificationId)).execute();
    } catch(error){
        console.error("Bildirim okundu olarak işaretlenemedi! Hata: ", error);
    }   
}

export async function getPendingReports() {
    try{
        return await db.select().from(Reports).where(eq(Reports.status, "pending")).execute();
    } catch(error) {
        console.error("Bekleyen atık bildirimleri alınırken hata oluştu! Hata: ", error);
        return [];
    }
}

export async function updateReportStatus(reportId: number, status: string) {
    try{
        const[updateReport]= await db
        .update(Reports)
        .set({status})
        .where(eq(Reports.id, reportId))
        .returning()
        .execute();

        return updateReport;

    } catch(error) {
        console.error("Atık ihbar durumu güncellenirken hata oluştu! Hata: ", error);
        return null;
    }
}

export async function getRecentReports(limit: number = 10) {
    try{
        const reports = await db
        .select()
        .from(Reports)
        .orderBy(desc(Reports.createdAt))
        .limit(limit)
        .execute();
        return reports;

    } catch(error){
        console.error("Son atık bildirimleri alınırken hata oluştu! Hata: ",error);
        return [];
    }
}

export async function getWasteCollectionTasks(limit: number = 20) {
    try{
       const tasks = await db
       .select({
        id: Reports.id,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
       })
       .from(Reports)
       .limit(limit)
       .execute();

       return tasks.map(task => ({
        ...task,
        date: task.date.toISOString().split('T')[0],
       }));
    } catch(error) {
        console.error("Atık toplama görevleri getirilirken hata oluştu! Hata: ", error);
        return [];
    }
}

export interface CollectedWaste {
    id: number;
    reportId: number;
    collectorId: number;
    collectionDate: string;  
    status: string;
    location: string;
    wasteType: string;
    amount: string;
}
  
export async function getCollectedWasteWithReportInfo(): Promise<CollectedWaste[]> {
    try {
      const collectedWastes = await db
        .select({
          id: CollectedWastes.id,
          status: CollectedWastes.status,
          collectorId: CollectedWastes.collectorId,
          reportId: CollectedWastes.reportId,
          collectionDate: CollectedWastes.collectionDate,
          location: Reports.location, 
          wasteType: Reports.wasteType,  
          amount: Reports.amount,  
        })
        .from(CollectedWastes)
        .leftJoin(Reports, eq(CollectedWastes.reportId, Reports.id))
        .execute();
  
      return collectedWastes.map((collectedWaste: any) => ({
        ...collectedWaste,
        collectionDate: collectedWaste.collectionDate.toISOString().split('T')[0], 
      }));
    } catch (error) {
      console.error("Toplanan atık bilgileri alınırken hata oluştu! Hata: ", error);
      return [];
    }
}
  
export async function saveReward(userId: number, amount: number) {
    try {
        const existingReward = await db
            .select()
            .from(Rewards)
            .where(and(
                eq(Rewards.userId, userId), 
                eq(Rewards.name, "Atık Toplama Ödülü")
            ))
            .execute();

        if (existingReward.length > 0) {
            return existingReward[0]; 
        }

        const [reward] = await db
            .insert(Rewards)
            .values({
                userId,
                name: "Atık Toplama Ödülü",
                collectionInfo: "Atık toplamadan kazanılan puanlar",
                points: amount,
                level: 1,
                isAvailable: true,
            })
            .returning()
            .execute();

        await createTransaction(userId, 'earned_collect', amount, 'Atık toplamadan kazanılan puanlar');

        return reward;
    } catch (error) {
        console.error("Ödül kaydedilirken hata oluştu! Hata: ", error);
        throw error;
    }
}


export async function saveNotificationReward(userId: number, amount: number) {
    try {
        const [reward] = await db
            .insert(Rewards)
            .values({
                userId,
                name: "Atık Bildirimi Ödülü", 
                collectionInfo: "Atık bildirimi yaparak kazanılan puanlar", 
                points: amount, 
                level: 1,  
                isAvailable: true,  
            })
            .returning()
            .execute();

        await createTransaction(userId, 'earned_collect', amount, 'Atık bildirimi yaparak kazanılan puanlar');

        return reward;
    } catch (error) {
        console.error("Atık bildirimi Ödülü kaydedilirken hata oluştu! Hata: ", error);
        throw error;
    }
}


export async function saveCollectedWastes(reportId: number, collectorId: number, verificationResult: any) {
    try{
        const [collectedWaste] = await db
        .insert(CollectedWastes)
        .values({
            reportId,
            collectorId,
            collectionDate: new Date(),
            status: "verified",
        })
        .returning()
        .execute();
        return collectedWaste;
    } catch(error){
       console.error("Toplanan atık bilgisi kaydedilirken hata oluştu!");
       throw error;
    }
}

export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
    try{
        const updateData: any = {status: newStatus};
        if(collectorId !== undefined){
            updateData.collectorId = collectorId;
        }

        const [updatedReport] = await db
        .update(Reports)
        .set(updateData)
        .where(eq(Reports.id, reportId))
        .returning()
        .execute();
        return updatedReport;
    } catch(error) {
        console.error("Görev durumu güncellenirken hata oluştu! Hata: ", error);
        throw error;
    }
}

export async function getAllRewards() {
    try{
        const rewards = await db
        .select({
            id: Rewards.id,
            userId: Rewards.userId,
            points: Rewards.points,
            level: Rewards.level,
            createdAt: Rewards.createdAt,
            userName: Users.name,
        })
        .from(Rewards)
        .leftJoin(Users,eq(Rewards.userId, Users.id))
        .orderBy(desc(Rewards.points))
        .execute();

        return rewards;

    } catch(error) {
        console.error("Tüm Ödüller getirilirken hata oluştu! Hata: ", error);
        return [];
    }
}

export async function getRewardTransactions(userId: number) {
    try {
        const transactions = await db
            .select({
                id: Transactions.id,
                type: Transactions.type,
                amount: Transactions.amount,
                description: Transactions.description,
                date: Transactions.date,
            })
            .from(Transactions)
            .where(eq(Transactions.userId, userId))
            .orderBy(desc(Transactions.date))
            .limit(10)
            .execute();

        const formattedTransactions = transactions.map(t => ({
            ...t,
            date: t.date.toISOString().split('T')[0], 
        }));

        return formattedTransactions;
    } catch (error) {
        console.error("Ödül işlemleri getirilirken hata oluştu! Hata: ", error);
        return [];
    }
}

export async function getAvailableRewards(userId: number) {
    try {
      
        const userTransactions = await getRewardTransactions(userId);
        const userPoints = userTransactions.reduce((total, transaction) => {
            if (transaction.type.startsWith('earned')) {
                return total + transaction.amount;
            }

            if (transaction.type.startsWith('redeemed')) {
                return total - transaction.amount;
            }
            return total;  
        }, 0);

        
        const dbRewards = await db
            .select({
                id: Rewards.id,
                name: Rewards.name,
                cost: Rewards.points,  
                description: Rewards.description,  
                collectionInfo: Rewards.collectionInfo, 
            })
            .from(Rewards)
            .where(eq(Rewards.isAvailable, true))
            .groupBy(Rewards.id)  
            .execute();

        const allRewards = [
            {
                id: 0,
                name: "Puanlarınız",
                cost: userPoints, 
                description: "Kazandığınız puanları kullanın",
                collectionInfo: "Atık bildiriminden ve toplanmasından kazanılan puanlar"
            },
            ...dbRewards  
        ];

        const uniqueRewards = allRewards.filter((reward, index, self) =>
            index === self.findIndex((r) => r.id === reward.id)
        );

        return uniqueRewards;

    } catch (error) {
        console.error("Kullanılabilir Ödüller getirilirken hata oluştu! Hata: ", error);
        return [];
    }
}


export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' |'redeemed', amount: number, description: string) {
    try{
        const [transaction] = await db
        .insert(Transactions)
        .values({userId, type, amount, description})
        .returning()
        .execute();

        return transaction;
    } catch(error){
        console.error("İşlem oluşturulamadı! Hata: ", error);
        throw error;
    }
}

export async function redeemReward(userId: number, rewardId: number) {
    try {
        const userReward = await getOrCreateReward(userId) as any;
        let transactionType: "earned_report" | "earned_collect" | "redeemed";
        let pointsToRedeem: number;
        let description: string;

        if (rewardId === 0) {
            pointsToRedeem = userReward.points;
            description = `Tüm puanlar kullanıldı: ${userReward.points}`;
            transactionType = 'redeemed'; 

            const [updateReward] = await db.update(Rewards)
                .set({ 
                    points: 0, 
                    updatedAt: new Date(),
                })
                .where(eq(Rewards.userId, userId))
                .returning()
                .execute();
            
            console.log("Reward after redemption (points set to 0):", updateReward);  
            await createTransaction(userId, transactionType, pointsToRedeem, description);
            return updateReward;

        } else {
            const availableReward = await db.select().from(Rewards).where(eq(Rewards.id, rewardId)).execute();
            if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
                throw new Error("Yetersiz puan/ Geçersiz Ödül");
            }

            pointsToRedeem = availableReward[0].points;
            description = `Kullanılan: ${availableReward[0].name}`;
            transactionType = 'redeemed'; 
            const [updatedReward] = await db.update(Rewards)
            .set({
                points: sql`${Rewards.points} - ${pointsToRedeem}`, 
                updatedAt: new Date(),
            })
            .where(eq(Rewards.userId, userId))
            .returning()
            .execute();
        
            
            console.log("Updated Reward after redemption:", updatedReward); 
            await createTransaction(userId, transactionType, pointsToRedeem, description);
            return updatedReward;
        }
    } catch (error) {
        console.error("Ödül kullanılırken hata oluştu! Hata: ", error);
        throw error;
    }
}


export async function getUserBalance(userId: number): Promise<number> {
    const transactions = await getRewardTransactions(userId);
    const balance = transactions.reduce((acc, transaction) => {
        return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount
    }, 0);

    return Math.max(balance, 0);
}

export async function addStation(name: string, location: string, recycleTypes: string, activeStatus: boolean) {
    try{
        const newStation = await db
        .insert(Stations)
        .values({
            name: name,
            location: location,
            recycleTypes: recycleTypes,
            activeStatus: activeStatus,
            createdAt: new Date(),
        }).returning();

        return newStation;
    } catch(error){
        console.error("İstasyon eklenemedi! Hata: ", error);
        return null;
    }   
}

export async function getAllStations() {
    try{
        const stations = await db
        .select({
            id: Stations.id,
            name: Stations.name,
            location: Stations.location,
            recycleTypes: Stations.recycleTypes,
            activeStatus: Stations.activeStatus,
            createdAt: Stations.createdAt,
        })
        .from(Stations)
        .orderBy(desc(Stations.createdAt))
        .execute();

        return stations;

       }catch(error){
        console.error("Geri dönüşüm noktası bilgileri getirilirken hata oluştu! Hata: ", error);
        return [];
    }
}