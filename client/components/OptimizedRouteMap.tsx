'use client';

import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { useState, useEffect } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';

interface Waypoint {
    lat: number;
    lng: number;
    parcelId: number;
    type: 'pickup' | 'delivery';
    address: string;
}

interface OptimizedRouteMapProps {
    origin?: { lat: number; lng: number };
    waypoints?: Way point[];
route: any;
summary ?: {
    totalDistance: string;
    totalDuration: string;
    optimizedWaypointOrder: number[];
};
height ?: string;
}

export default function OptimizedRouteMap({
    origin,
    waypoints = [],
    route,
    summary,
    height = '500px'
}: OptimizedRouteMapProps) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    useEffect(() => {
        if (route) {
            setDirections(route);
        }
    }, [route]);

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

    if (!origin && waypoints.length === 0) {
        return (
            <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
                <div className="text-center p-4">
                    <p className="text-gray-600 font-medium">No route data available</p>
                    <p className="text-sm text-gray-500 mt-1">Assign parcels to see the optimized route</p>
                </div>
            </div>
        );
    }

    const center = origin || waypoints[0] || { lat: 23.8103, lng: 90.4125 };

    // Get waypoint marker color based on type
    const getMarkerIcon = (type: 'pickup' | 'delivery', index: number) => {
        const color = type === 'pickup' ? 'green' : 'red';
        return {
            url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
            labelOrigin: new google.maps.Point(16, -10),
        };
    };

    return (
        <div className="space-y-4">
            {/* Route Summary */}
            {summary && (
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Route Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Distance</p>
                            <p className="text-lg font-semibold text-blue-600">{summary.totalDistance}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Estimated Time</p>
                            <p className="text-lg font-semibold text-green-600">{summary.totalDuration}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Stops</p>
                            <p className="text-lg font-semibold text-purple-600">{waypoints.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow" style={{ height }}>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={center}
                    zoom={12}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: true,
                        fullscreenControl: true,
                    }}
                >
                    {/* Origin Marker (Agent's starting location) */}
                    {origin && (
                        <Marker
                            position={origin}
                            icon={{
                                url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                scaledSize: new google.maps.Size(40, 40),
                            }}
                            title="Starting Location"
                            label={{
                                text: 'START',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold',
                            }}
                        />
                    )}

                    {/* Waypoint Markers */}
                    {waypoints.map((waypoint, index) => (
                        <Marker
                            key={`${waypoint.parcelId}-${waypoint.type}`}
                            position={{ lat: waypoint.lat, lng: waypoint.lng }}
                            icon={getMarkerIcon(waypoint.type, index)}
                            title={waypoint.address}
                            label={{
                                text: `${index + 1}`,
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                            }}
                            onClick={() => setSelectedWaypoint(waypoint)}
                        />
                    ))}

                    {/* Info Window for selected waypoint */}
                    {selectedWaypoint && (
                        <InfoWindow
                            position={{ lat: selectedWaypoint.lat, lng: selectedWaypoint.lng }}
                            onCloseClick={() => setSelectedWaypoint(null)}
                        >
                            <div className="p-2">
                                <p className="font-semibold text-sm">
                                    {selectedWaypoint.type === 'pickup' ? '📦 Pickup' : '🏠 Delivery'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">{selectedWaypoint.address}</p>
                                <p className="text-xs text-gray-500 mt-1">Parcel #{selectedWaypoint.parcelId}</p>
                            </div>
                        </InfoWindow>
                    )}

                    {/* Optimized Route Path */}
                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                suppressMarkers: true, // Using custom markers
                                polylineOptions: {
                                    strokeColor: '#3B82F6',
                                    strokeWeight: 5,
                                    strokeOpacity: 0.8,
                                },
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* Waypoint List */}
            {waypoints.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Optimized Route Order</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {origin && (
                            <div className="flex items-start gap-3 p-2 bg-blue-50 rounded">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    ★
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">Starting Location</p>
                                    <p className="text-xs text-gray-600 truncate">Agent's current position</p>
                                </div>
                            </div>
                        )}

                        {way points.map((waypoint, index) => (
                        <div
                            key={`${waypoint.parcelId}-${waypoint.type}-${index}`}
                            className={`flex items-start gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${waypoint.type === 'pickup' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                                }`}
                            onClick={() => setSelectedWaypoint(waypoint)}
                        >
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    {waypoint.type === 'pickup' ? '📦 Pickup' : '🏠 Delivery'} - Parcel #{waypoint.parcelId}
                                </p>
                                <p className="text-xs text-gray-600 truncate">{waypoint.address}</p>
                            </div>
                        </div>
            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
