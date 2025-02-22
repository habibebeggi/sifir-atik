"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { getUserByEmail, getReportsByUserId } from "@/utils/db/actions"; 

interface Report {
  id: number; 
  location: string;
  wasteType: string;
  amount: string;
  createdAt: string; 
}

export default function ReportsTable() {
  const [userId, setUserId] = useState<number | null>(null); 
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserId = async () => {
      const email = localStorage.getItem('userEmail');
      if (email) {
        try {
          const user = await getUserByEmail(email);
          if (user) {
            setUserId(user.id); 
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri alınırken hata oluştu:", error);
        }
      } else {
        
        console.log("E-posta bulunamadı.");
      }
    };

    fetchUserId();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };


  useEffect(() => {
    if (userId !== null) {
      const fetchReports = async () => {
        try {
         
          const fetchedReports = await getReportsByUserId(userId);

          
          const formattedReports = fetchedReports.map((report) => ({
            ...report,
            createdAt: new Date(report.createdAt).toISOString().split("T")[0], 
          }));

          
          const sortedReports = formattedReports.sort((a, b) => b.id - a.id);

          setReports(sortedReports); 
        } catch (error) {
          console.error("Atık bildirimleri getirilirken hata oluştu:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchReports();
    }
  }, [userId]); 


  return (
    <div className="w-full max-w-full mb-8"> 
      <h2 className="text-2xl text-center font-semibold mb-4 mt-8 text-gray-800">Bildirdiğim Atıklar</h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
        <div className="overflow-x-auto"> 
          <table className="w-full min-w-[100px]"> 
            <thead className="bg-gradient-to-r from-blue-500 to-green-500 p-6">
              <tr className="text-blue-950">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rapor Id</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Konum</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tür</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Miktar</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.id}</td> 
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-purple-600" />
                    {report.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(report.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
