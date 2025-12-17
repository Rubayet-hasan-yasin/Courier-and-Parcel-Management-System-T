'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface ConfigContextType {
    googleMapsApiKey: string | null;
    isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType>({
    googleMapsApiKey: null,
    isLoading: true,
});

export const useConfig = () => useContext(ConfigContext);

export default function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                let key = null;
                try {
                    const config = await api.get<{ googleMapsApiKey: string }>('/config');
                    key = config.googleMapsApiKey;
                } catch (err) {
                    console.warn('Failed to fetch config from backend:', err);
                }

                if (!key) {
                    key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
                }

                if (!key) {
                    console.warn('Google Maps API Key missing. Map features will be disabled.');
                }

                setGoogleMapsApiKey(key);
            } catch (error) {
                console.error('Error initializing application config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <ConfigContext.Provider value={{ googleMapsApiKey, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
}
