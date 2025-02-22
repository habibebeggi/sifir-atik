"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getReportsByUserId, getUserIdByEmail } from "@/utils/db/actions"; 
import { BasicChart } from "./BasicChart"; 
import { PackagePlus, Trash2Icon } from "lucide-react"; 

export default function ReportedChart() {
  const [loading, setLoading] = useState(true);
  const [reportedReports, setReportedReports] = useState<any[]>([]); 

  useEffect(() => {
    const fetchReportedReports = async () => {
      setLoading(true);
      try {
        const userEmail = localStorage.getItem("userEmail"); 
        if (userEmail) {
          const userId = await getUserIdByEmail(userEmail);
          if (userId) {
            const fetchedReports = await getReportsByUserId(userId);

            if (fetchedReports && fetchedReports.length > 0) {
              setReportedReports(fetchedReports); 
            } else {
              toast.error("Bildirilen atıklar bulunamadı.");
            }
          } else {
            toast.error("Kullanıcı bilgisi alınamadı.");
          }
        } else {
          toast.error("Kullanıcı e-posta bilgisi bulunamadı.");
        }
      } catch (error) {
        console.error("Hata:", error);
        toast.error("Bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportedReports(); 
  }, []);

  return (
    <div className="space-y-4 justify-start">
      
      <BasicChart 
        title="Bildirilen Atık Sayısı"
        value={reportedReports.length}
        icon={PackagePlus} 
        iconColor="text-blue-600"
      />
    </div>
  );
}
