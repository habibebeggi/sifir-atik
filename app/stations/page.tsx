"use client";
import React, { useEffect, useState } from "react";
import { getAllStations } from "@/utils/db/actions"; 

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; 

const StationsMap = () => {
  const [map, setMap] = useState<any>(null); 
  const [stationData, setStationData] = useState<any[]>([]); 
  const [filteredStations, setFilteredStations] = useState<any[]>([]); 
  const [cityInput, setCityInput] = useState<string>(""); 
  const [recycleTypeInput, setRecycleTypeInput] = useState<string>(""); 
  const [isFiltered, setIsFiltered] = useState<boolean>(false); 

  const initialCenter = { lat: 39.9334, lng: 32.8597 }; 

  const fetchStationData = async () => {
    try {
      const stations = await getAllStations();
      setStationData(stations);
      setFilteredStations(stations); 
    } catch (error) {
      console.error("İstasyon verileri çekilemedi:", error);
    }
  };


  const initializeMap = () => {
    const google = window.google;
    if (!google) {
      console.error("Google Maps API yüklenemedi");
      return;
    }
    const mapInstance = new google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        center: initialCenter, 
        zoom: 12, 
      }
    );
    setMap(mapInstance); 
  };

  const geocodeLocation = (address: string) => {
    const google = window.google;
    const geocoder = new google.maps.Geocoder();

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ lat, lng });
        } else {
          reject(
            new Error("Geocoding hatası: geçersiz adres veya başka bir hata")
          );
        }
      });
    });
  };

  
  const addMarkers = async () => {
    if (!map || !filteredStations.length) return;
    const google = window.google;

    filteredStations.forEach(async (station) => {
      const { location, name, recycleTypes } = station;
      try {
        const { lat, lng } = await geocodeLocation(location);
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: name,
        });

        const infoWindowContent = `
        <div class="bg-white p-4 rounded-lg shadow-lg max-w-[300px]">
          <h3 class="text-xl font-semibold text-gray-800 mb-3">${name}</h3>
          <p class="text-gray-600 text-sm mb-2">
            <span class="font-bold text-gray-800">Konum:</span> ${location}
          </p>
          <p class="text-gray-600 text-sm">
            <span class="font-bold text-gray-800">Geri Dönüşüm Türleri:</span> ${
              recycleTypes || "Bilgi yok"
            }
          </p>
        </div>
      `;
        const infoWindow = new google.maps.InfoWindow({
          content: infoWindowContent,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
        marker.addListener("mouseover", () => {
          infoWindow.open(map, marker);
        });
        marker.addListener("mouseout", () => {
          infoWindow.close();
        });
      } catch (error) {
        console.error("Konum geocoding hatası:", error);
      }
    });
  };


  useEffect(() => {
    if (window.google) {
      initializeMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => {
        initializeMap();
      };
      script.onerror = () => {
        console.error("Google Maps API yüklenemedi!");
      };
      document.head.appendChild(script);
    }
  }, []);


  useEffect(() => {
    if (map && filteredStations.length) {
      addMarkers();
    }
  }, [map, filteredStations]);

  
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
    <div className="flex flex-col gap-4 p-4">
      <div className="w-full md:flex gap-4">
        <div className="w-full md:w-1/2 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <h2 className="text-center text-3xl font-semibold text-gray-800 mb-8 mt-10">
              Atık Toplama Merkezi Ara
            </h2>

            <div className="mb-10">
              <label
                htmlFor="cityInput"
                className="block text-md font-medium text-gray-700"
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
                className="block text-md font-medium text-gray-700"
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
              className="w-full mt-2 py-3 px-6 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Ara
            </button>
            <div className="text-md font-sans text-gray-600 mt-16 ">
              <p className="mb-3">
                * Bu formu kullanarak, aradığınız şehir veya geri dönüşüm türüne
                göre en yakın Atık Toplama Merkezleri'ni (ATM) kolayca
                bulabilirsiniz.
              </p>
              <p className="mb-3 mt-6">
                * Alternatif olarak, harita üzerindeki işaretçilere tıklayarak
                da Atık Toplama Merkezlerine ait konum ve geri dönüşüm türü bilgilerine de ulaşabilirsiniz.
              </p>

            </div>
          </div>
        </div>

        <div
          id="map"
          className="w-full md:w-1/2 h-[500px] sm:h-[500px] md:h-[500px] lg:h-[600px] xl:h-[700px] bg-gray-100 rounded-xl shadow-lg"
        ></div>
      </div>

      <div className="w-full mt-10">
        {isFiltered && filteredStations.length > 0 ? (
          <div className="rounded-xl shadow-lg overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] table-auto border-collapse text-left rounded-xl border overflow-x-auto border-gray-300">
                <thead className="bg-gradient-to-r from-blue-700 to-green-600 text-white rounded-t-xl">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                      İstasyon Adı
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                      Konum
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">
                      Geri Dönüşüm Türü
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStations.map((station, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors duration-200 text-md"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.location}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap break-words">
                        {station.recycleTypes || "Geri dönüşüm türü yok"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-start h-full text-left py-4 text-gray-700">
            Hiçbir sonuç bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};

export default StationsMap;
