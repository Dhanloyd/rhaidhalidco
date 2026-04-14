"use client";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  lat: number;
  lng: number;
  setLocation: (lat: number, lng: number) => void;
};

// 🔥 THIS MOVES THE MAP WHEN SEARCH CHANGES
const FlyToLocation = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15, {
        duration: 1.5,
      });
    }
  }, [lat, lng]);

  return null;
};

const LocationPicker = ({ lat, lng, setLocation }: Props) => {
  const [position, setPosition] = useState<[number, number]>([
    lat,
    lng,
  ]);

  useEffect(() => {
    setPosition([lat, lng]);
  }, [lat, lng]);

  return (
    <MapContainer
      center={position}
      zoom={15}
      style={{
        height: "320px",
        width: "100%",
        borderRadius: "12px",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={position} />

      {/* 🔥 MAP ANIMATION CONTROL */}
      <FlyToLocation lat={lat} lng={lng} />
    </MapContainer>
  );
};

export default LocationPicker;