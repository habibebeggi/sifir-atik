"use client";
import { addStation } from "@/utils/db/actions";
import React, { useState, useEffect } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const AddStationForm = () => {
  const [name, setName] = useState<string>("");
  const [location, setLocation] = useState<string>(""); 
  const [recycleTypes, setRecycleTypes] = useState<string>("");
  const [activeStatus, setActiveStatus] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const mapElement = document.getElementById("map") as HTMLDivElement;
      if (mapElement) {
        const map = new window.google.maps.Map(mapElement, {
          center: { lat: 39.9334, lng: 32.8597 }, 
          zoom: 13,
        });

        const marker = new window.google.maps.Marker({
          map: map,
          draggable: true, 
        });

        
        window.google.maps.event.addListener(map, "click", (event: google.maps.MapMouseEvent) => {
          const latLng = event.latLng;
          if (latLng) {
            marker.setPosition(latLng);
            setLatLng({ lat: latLng.lat(), lng: latLng.lng() });
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: latLng }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                setLocation(results[0].formatted_address); 
              } else {
                setLocation("Adres bulunamadı.");
              }
            });
          }
        });

        const center = map.getCenter();
        if (center) {
          setLatLng({ lat: center.lat(), lng: center.lng() });
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (latLng) {
      const latStr = latLng.lat.toString();
      const lngStr = latLng.lng.toString();
      const result = await addStation(name, location, recycleTypes, activeStatus);

      if (result) {
        setSuccessMessage("İstasyon başarıyla eklendi!");
        setName("");
        setLocation("");
        setRecycleTypes("");
        setActiveStatus(true);
        setLatLng(null);
      } else {
        setError("İstasyon eklenemedi. Lütfen tekrar deneyin.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Yeni İstasyon Ekle</h2>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {successMessage && <div className="text-green-500 text-center mb-4">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              İstasyon Adı:
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Konum:
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Konum seçin"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="recycleTypes" className="block text-sm font-medium text-gray-700">
              Geri Dönüşüm Türleri (Virgülle ayırın):
            </label>
            <input
              type="text"
              id="recycleTypes"
              value={recycleTypes}
              onChange={(e) => setRecycleTypes(e.target.value)}
              required
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="activeStatus" className="block text-sm font-medium text-gray-700">
              Aktif Durum:
            </label>
            <select
              id="activeStatus"
              value={activeStatus ? "active" : "inactive"}
              onChange={(e) => setActiveStatus(e.target.value === "active")}
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Yükleniyor..." : "İstasyon Ekle"}
          </button>
        </form>
        <div
          id="map"
          className="mt-6 w-full h-96 border border-gray-300 rounded-lg"
        ></div>
      </div>
    </div>
  );
};

export default AddStationForm;
