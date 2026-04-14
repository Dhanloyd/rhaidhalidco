"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ FIX default marker issue (important for Vite/Vercel)
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  lat: number;
  lng: number;
  setLocation: (lat: number, lng: number) => void;
};

const LocationPicker = ({ lat, lng, setLocation }: Props) => {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);

  // 🔄 Sync when parent updates
  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  // 📍 Click handler
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setLocation(lat, lng);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{
        height: "320px",
        width: "100%",
        borderRadius: "12px",
      }}
      scrollWheelZoom={true}
    >
      {/* 🗺 Map Tiles */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 📍 Marker */}
      <Marker position={position} />

      {/* 👇 Click Listener */}
      <MapClickHandler />
    </MapContainer>
  );
};

export default LocationPicker;