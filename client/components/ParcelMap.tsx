'use client';

import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useEffect, useMemo } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
// Note: @react-google-maps/api Marker component internally handles the google.maps.Marker deprecation
// No action needed as the library will be updated to use AdvancedMarkerElement in future versions

interface ParcelMapProps {
  parcel?: {
    pickupLatitude?: number;
    pickupLongitude?: number;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    currentLatitude?: number;
    currentLongitude?: number;
    pickupAddress?: string;
    deliveryAddress?: string;
    status?: string;
  };
  showRoute?: boolean;
  height?: string;
}

export default function ParcelMap({ parcel, showRoute = true, height = '400px' }: ParcelMapProps) {
  // Use the globally loaded Google Maps instance from GoogleMapsProvider
  const { isLoaded, loadError } = useGoogleMaps();

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapError, setMapError] = useState<string>('');

  // Helper function to validate coordinates
  const isValidCoordinate = (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  };

  // Calculate center and zoom
  const center = useMemo(() => {
    if (isValidCoordinate(parcel?.currentLatitude) && isValidCoordinate(parcel?.currentLongitude)) {
      return { lat: parcel.currentLatitude, lng: parcel.currentLongitude };
    }
    if (isValidCoordinate(parcel?.pickupLatitude) && isValidCoordinate(parcel?.pickupLongitude)) {
      return { lat: parcel.pickupLatitude, lng: parcel.pickupLongitude };
    }
    // Default to Dhaka, Bangladesh
    return { lat: 23.8103, lng: 90.4125 };
  }, [parcel]);

  // Calculate route
  useEffect(() => {
    if (!isLoaded || !showRoute || !parcel) return;
    if (!isValidCoordinate(parcel.pickupLatitude) || !isValidCoordinate(parcel.pickupLongitude)) return;
    if (!isValidCoordinate(parcel.deliveryLatitude) || !isValidCoordinate(parcel.deliveryLongitude)) return;

    const directionsService = new google.maps.DirectionsService();

    const origin = { lat: parcel.pickupLatitude, lng: parcel.pickupLongitude };
    const destination = { lat: parcel.deliveryLatitude, lng: parcel.deliveryLongitude };

    // Add current location as waypoint if parcel is in transit
    const waypoints: google.maps.DirectionsWaypoint[] = [];
    if (
      isValidCoordinate(parcel.currentLatitude) &&
      isValidCoordinate(parcel.currentLongitude) &&
      (parcel.status === 'in_transit' || parcel.status === 'picked_up')
    ) {
      waypoints.push({
        location: { lat: parcel.currentLatitude, lng: parcel.currentLongitude },
        stopover: true,
      });
    }

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setMapError('');
        } else {
          setMapError('Could not calculate route');
          console.error('Directions request failed:', status);
        }
      },
    );
  }, [isLoaded, showRoute, parcel]);

  if (loadError) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Map failed to load</p>
          <p className="text-sm text-gray-600 mt-1">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GMAP_API_KEY) {
    return (
      <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center p-4" style={{ height }}>
        <div className="text-center">
          <p className="text-yellow-800 font-medium">Google Maps API key not configured</p>
          <p className="text-sm text-yellow-700 mt-1">Please set NEXT_PUBLIC_GMAP_API_KEY in .env.local</p>
        </div>
      </div>
    );
  }

  const hasValidCoordinates =
    (isValidCoordinate(parcel?.pickupLatitude) && isValidCoordinate(parcel?.pickupLongitude)) ||
    (isValidCoordinate(parcel?.currentLatitude) && isValidCoordinate(parcel?.currentLongitude));

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={hasValidCoordinates ? 12 : 11}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Pickup Marker */}
        {isValidCoordinate(parcel?.pickupLatitude) && isValidCoordinate(parcel?.pickupLongitude) && (
          <Marker
            position={{ lat: parcel.pickupLatitude, lng: parcel.pickupLongitude }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
            title={`Pickup: ${parcel.pickupAddress || 'Pickup Location'}`}
          />
        )}

        {/* Delivery Marker */}
        {isValidCoordinate(parcel?.deliveryLatitude) && isValidCoordinate(parcel?.deliveryLongitude) && (
          <Marker
            position={{ lat: parcel.deliveryLatitude, lng: parcel.deliveryLongitude }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            }}
            title={`Delivery: ${parcel.deliveryAddress || 'Delivery Location'}`}
          />
        )}

        {/* Current Location Marker (for in-transit parcels) */}
        {isValidCoordinate(parcel?.currentLatitude) && isValidCoordinate(parcel?.currentLongitude) && (
          <Marker
            position={{ lat: parcel.currentLatitude, lng: parcel.currentLongitude }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            }}
            title="Current Location"
            animation={google.maps.Animation.BOUNCE}
          />
        )}

        {/* Route directions */}
        {showRoute && directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, // We're using custom markers
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 5,
                strokeOpacity: 0.7,
              },
            }}
          />
        )}
      </GoogleMap>

      {mapError && (
        <div className="absolute bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          <p className="text-sm text-yellow-800">{mapError}</p>
        </div>
      )}
    </div>
  );
}
