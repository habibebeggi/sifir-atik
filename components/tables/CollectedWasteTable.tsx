import React, { useState, useEffect } from 'react';
import { getCollectedWastesByCollector, getCollectedWasteWithReportInfo, getUserByEmail } from '@/utils/db/actions';
import { MapPin } from 'lucide-react';


interface CollectedWaste {
  id: number;
  reportId: number;
  collectorId: number;
  collectionDate: string; 
  status: string;
  location: string;
  wasteType: string;
  amount: string;
}

const CollectedWasteTable = () => {
  const[collectorId, setCollectorId] = useState<number| null>(null);
  const [collectedWastes, setCollectedWastes] = useState<CollectedWaste[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchedCollectorId = async () => {
      const email = localStorage.getItem('userEmail');
      if(email){
        try{
          const user = await getUserByEmail(email);
          if(user){
            setCollectorId(user.id);
          }
        } catch(error){
          console.error("Kullanıcı bilgileri alınırken hata oluştu! Hata: ", error);
        }
      } else {
        console.log("E-posta bulunamadı.");
      }
    };

    fetchedCollectorId();
  },[]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); 
  };

  useEffect(()=>{
    if(collectorId !== null){
      const fetchCollectedWastes = async () => {
        try{
          setLoading(true);
          setError(null);

          const fetchedWastes = await getCollectedWasteWithReportInfo();
          const filteredWastes = fetchedWastes.filter((waste: CollectedWaste) => waste.collectorId === collectorId);
          setCollectedWastes(filteredWastes);
        }catch(error){
          setError("Toplanan atık bilgileri getirilirken hata oluştu!");
        } finally{
          setLoading(false);
        }
      };
      fetchCollectedWastes();
    }
  }, [collectorId]);

  return (
    <div className="w-full max-w-full mb-8">
      <h2 className="text-2xl text-center font-semibold mb-4 mt-8 text-gray-800">Topladığım Atıklar</h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
        <div className="overflow-x-auto"> 
          <table className="w-full min-w-[100px]"> 
            <thead className="bg-gradient-to-r from-green-500 to-blue-500 p-6">
              <tr className="text-blue-950">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rapor Id</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Konum</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tür</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Miktar</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {collectedWastes.map((waste) => (
                <tr key={waste.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{waste.reportId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                    {waste.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{waste.wasteType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{waste.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(waste.collectionDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
};

export default CollectedWasteTable;
