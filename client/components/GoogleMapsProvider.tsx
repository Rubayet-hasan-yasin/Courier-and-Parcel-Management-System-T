'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useConfig } from './ConfigProvider';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
    isLoaded: false,
    loadError: undefined,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export default function GoogleMapsProvider({ children }: { children: ReactNode }) {
    const { googleMapsApiKey } = useConfig();

    if (!googleMapsApiKey) {
        return (
            <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: new Error('Map disabled') }}>
                {children}
            </GoogleMapsContext.Provider>
        );
    }

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: googleMapsApiKey,
        id: 'google-map-script',
        libraries,
    });

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-6">
                    <h2 className="text-red-700 font-bold mb-2">Google Maps Error</h2>
                    <p className="text-red-600">{loadError.message}</p>
                </div>
            </div>
        );
    }

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
}
