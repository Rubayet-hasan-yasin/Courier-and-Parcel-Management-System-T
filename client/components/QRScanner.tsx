'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

import { Scanner } from '@yudiel/react-qr-scanner';

interface QRScannerProps {
    onScanSuccess: (data: any) => void;
    onClose: () => void;
    mode: 'pickup' | 'delivery';
}

export default function QRCodeScanner({ onScanSuccess, onClose, mode }: QRScannerProps) {
    const [scanning, setScanning] = useState(true);
    const [error, setError] = useState<string>('');
    const [hasCamera, setHasCamera] = useState<boolean>(false);

    const confirmPickupMutation = useMutation({
        mutationFn: (qrData: string) => api.post('/qrcode/confirm-pickup', { qrData }),
        onSuccess: (data) => {
            showSuccessToast('Pickup confirmed successfully!');
            onScanSuccess(data);
            onClose();
        },
        onError: (error: any) => {
            showErrorToast(error.message || 'Failed to confirm pickup');
            setError(error.message);
        },
    });

    const confirmDeliveryMutation = useMutation({
        mutationFn: (qrData: string) => api.post('/qrcode/confirm-delivery', { qrData }),
        onSuccess: (data) => {
            showSuccessToast('Delivery confirmed successfully!');
            onScanSuccess(data);
            onClose();
        },
        onError: (error: any) => {
            showErrorToast(error.message || 'Failed to confirm delivery');
            setError(error.message);
        },
    });

    const handleScan = (detectedCodes: any) => {
        if (detectedCodes && detectedCodes.length > 0 && scanning) {
            const rawValue = detectedCodes[0].rawValue;

            if (rawValue) {
                setScanning(false);
                if (mode === 'pickup') {
                    confirmPickupMutation.mutate(rawValue);
                } else {
                    confirmDeliveryMutation.mutate(rawValue);
                }
            }
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Camera access is not available. Please ensure you are using HTTPS or localhost due to browser security restrictions.');
                setHasCamera(false);
            } else {
                setHasCamera(true);
            }
        }
    }, []);

    const handleError = (err: any) => {
        console.error('QR Scanner Error:', err);
        setError('Failed to access camera. Please allow camera permissions and ensure you are on a secure connection (HTTPS).');
    };

    const isPending = confirmPickupMutation.isPending || confirmDeliveryMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {mode === 'pickup' ? 'Scan for Pickup' : 'Scan for Delivery'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isPending}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {isPending ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Processing...</p>
                    </div>
                ) : scanning ? (
                    <div className="space-y-4">
                        <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
                            {hasCamera ? (
                                <Scanner
                                    onError={handleError}
                                    onScan={handleScan}
                                    constraints={{
                                        aspectRatio: 1,
                                        width: { ideal: 1920 },
                                        height: { ideal: 1080 },
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center">
                                    <p>Camera not available</p>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Position the QR code within the frame
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600">QR Code detected, processing...</p>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => setScanning(true)}
                        disabled={isPending}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
                    >
                        Retry
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
