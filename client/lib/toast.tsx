'use client';

import { useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

interface ToastConfig {
    id?: string;
    duration?: number;
}

export function showSuccessToast(message: string, config?: ToastConfig) {
    toast.success(message, {
        id: config?.id,
        duration: config?.duration || 3000,
        style: {
            background: '#10B981',
            color: '#fff',
        },
    });
}

export function showErrorToast(message: string, config?: ToastConfig) {
    toast.error(message, {
        id: config?.id,
        duration: config?.duration || 4000,
        style: {
            background: '#EF4444',
            color: '#fff',
        },
    });
}

export function showInfoToast(message: string, config?: ToastConfig) {
    toast(message, {
        id: config?.id,
        duration: config?.duration || 3000,
        icon: 'ℹ️',
        style: {
            background: '#3B82F6',
            color: '#fff',
        },
    });
}

export function showLoadingToast(message: string, id?: string) {
    return toast.loading(message, {
        id,
        style: {
            background: '#6B7280',
            color: '#fff',
        },
    });
}

export function dismissToast(id?: string) {
    toast.dismiss(id);
}

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
                duration: 3000,
                style: {
                    borderRadius: '8px',
                    padding: '12px 16px',
                },
            }}
        />
    );
}

export function useRealtimeToasts() {
    useEffect(() => {
        const handleStatusUpdate = (event: CustomEvent) => {
            const { status, trackingNumber } = event.detail;
            showInfoToast(`Parcel ${trackingNumber} status updated: ${status}`);
        };

        const handleNewParcel = (event: CustomEvent) => {
            const { trackingNumber } = event.detail;
            showSuccessToast(`New parcel booked: ${trackingNumber}`);
        };

        window.addEventListener('parcelStatusUpdate' as any, handleStatusUpdate);
        window.addEventListener('newParcelBooked' as any, handleNewParcel);

        return () => {
            window.removeEventListener('parcelStatusUpdate' as any, handleStatusUpdate);
            window.removeEventListener('newParcelBooked' as any, handleNewParcel);
        };
    }, []);
}
