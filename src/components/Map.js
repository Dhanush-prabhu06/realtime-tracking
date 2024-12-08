import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const Map = ({ locations, currentDriverId }) => {
  const mapStyles = { height: "630px", width: "100%" };
  const defaultCenter = { lat: 13.326955, lng: 77.123847 };

  return (
    <LoadScript googleMapsApiKey="AIzaSyBC6jH0EHIKMEck4lNROeKGExDzDHlfDkQ">
      <GoogleMap mapContainerStyle={mapStyles} zoom={10} center={defaultCenter}>
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            icon={
              loc.id === currentDriverId
                ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            }
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
