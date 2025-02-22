"use client";
import React, { useEffect, useState } from "react";
import { getAllStations } from "@/utils/db/actions";

const StationChart = () => {
  const [stationData, setStationData] = useState<any[]>([]);
  const [filteredStations, setFilteredStations] = useState<any[]>([]);
  const [cityInput, setCityInput] = useState<string>("");
  const [recycleTypeInput, setRecycleTypeInput] = useState<string>("");
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

  const fetchStationData = async () => {
    try {
      const stations = await getAllStations();
      setStationData(stations);
    } catch (error) {
      console.error("İstasyon verileri çekilemedi:", error);
    }
  };

  const handleSearch = () => {
    const filtered = stationData.filter((station) => {
      const cityMatches = cityInput
        ? station.location.toLowerCase().includes(cityInput.toLowerCase())  
        : true;

      const recycleMatches = recycleTypeInput
        ? station.recycleTypes &&
          station.recycleTypes
            .split(",")
            .some((type: string) =>
              type.toLowerCase().includes(recycleTypeInput.toLowerCase()) 
            )
        : true;

      return cityMatches && recycleMatches;
    });

    setFilteredStations(filtered);
    setIsFiltered(filtered.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();  
    }
  };

  useEffect(() => {
    fetchStationData();
  }, []);

  return (
    <div className="container mx-auto p-0 my-0">
      <div className="flex flex-col gap-8 h-full items-start">
        <div className="bg-white p-12 rounded-xl shadow-lg max-w-md w-full"> 
          <h2 className="text-left text-2xl font-semibold text-gray-800 mb-6"> 
            Atık Toplama Merkezi Ara
          </h2>

          <div className="mb-6">
            <label
              htmlFor="cityInput"
              className="block text-sm font-medium text-gray-700"
            >
              İl Adı:
            </label>
            <input
              id="cityInput"
              type="text"
              placeholder="Şehir adı giriniz..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-purple-500"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="recycleTypeInput"
              className="block text-sm font-medium text-gray-700"
            >
              Geri Dönüşüm Türü:
            </label>
            <input
              id="recycleTypeInput"
              type="text"
              placeholder="Geri dönüşüm türü giriniz..."
              value={recycleTypeInput}
              onChange={(e) => setRecycleTypeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleSearch}
            className="w-full mt-4 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Ara
          </button>
        </div>
        <div className="w-full max-w-7xl"> 
          {isFiltered && filteredStations.length > 0 ? (
            <div className="rounded-xl shadow-lg overflow-hidden w-full"> 
              <table className="w-full min-w-[100px] table-auto border-collapse text-left rounded-xl border border-gray-300">
                <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-t-xl">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      İstasyon Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Konum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Geri Dönüşüm Türü
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStations.map((station, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.location}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">
                        {station.recycleTypes ? station.recycleTypes : "Geri dönüşüm türü yok"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-start h-full text-left py-4 text-gray-700">
              Hiçbir sonuç bulunamadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationChart;
