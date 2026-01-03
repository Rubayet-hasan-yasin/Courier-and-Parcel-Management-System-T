'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAssignedParcels, useUpdateParcelStatus, useLogout } from '@/lib/hooks';
import { getCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import QRCodeScanner from '@/components/QRScanner';
import ParcelMap from '@/components/ParcelMap';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { useAgentDailySummary } from '@/lib/agent-summary';

function AgentDashboardContent() {
    const router = useRouter();
    const user = getCurrentUser();
    const { data: parcels, isLoading, refetch } = useAssignedParcels();
    const updateStatus = useUpdateParcelStatus();
    const logoutMutation = useLogout();
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scannerMode, setScannerMode] = useState<'pickup' | 'delivery'>('pickup');
    const [selectedParcelForMap, setSelectedParcelForMap] = useState<any>(null);
    const { data: dailySummary } = useAgentDailySummary();

    const handleStatusUpdate = async (parcelId: number, status: string) => {
        try {
            await updateStatus.mutateAsync({ id: parcelId, status });
            showSuccessToast('Status updated successfully!');
            refetch();
            setSelectedParcel(null);
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to update status');
        }
    };

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
        router.push('/login');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-100 text-gray-700';
            case 'picked_up':
                return 'bg-blue-100 text-blue-700';
            case 'in_transit':
                return 'bg-yellow-100 text-yellow-700';
            case 'delivered':
                return 'bg-green-100 text-green-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getNextStatus = (currentStatus: string) => {
        switch (currentStatus) {
            case 'pending':
                return ['picked_up', 'failed'];
            case 'picked_up':
                return ['in_transit', 'failed'];
            case 'in_transit':
                return ['delivered', 'failed'];
            default:
                return [];
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {showScanner && (
                <QRCodeScanner
                    mode={scannerMode}
                    onScanSuccess={() => refetch()}
                    onClose={() => setShowScanner(false)}
                />
            )}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                📦 Courier System
                            </Link>
                            <span className="text-sm text-gray-600">Agent Dashboard</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Daily Summary */}
                {dailySummary && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-sm text-gray-600 mb-1">Today's Total</p>
                            <p className="text-2xl font-bold text-gray-900">{dailySummary.total}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-sm text-gray-600 mb-1">Delivered</p>
                            <p className="text-2xl font-bold text-green-600">{dailySummary.delivered}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-sm text-gray-600 mb-1">In Progress</p>
                            <p className="text-2xl font-bold text-yellow-600">{dailySummary.inProgress}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-sm text-gray-600 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-gray-600">{dailySummary.pending}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                            <p className="text-2xl font-bold text-blue-600">{dailySummary.completionRate}%</p>
                        </div>
                    </div>
                )}

                {/* QR Scan Buttons */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => {
                            setScannerMode('pickup');
                            setShowScanner(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
                    >
                        📷 Scan for Pickup
                    </button>
                    <button
                        onClick={() => {
                            setScannerMode('delivery');
                            setShowScanner(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition"
                    >
                        📷 Scan for Delivery
                    </button>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-8">Assigned Parcels</h1>

                {isLoading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : !parcels || parcels.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <p className="text-gray-500">No parcels assigned yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {parcels.map((parcel: any) => (
                            <div
                                key={parcel.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-mono text-sm text-gray-600 mb-1">
                                            #{parcel.trackingNumber}
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {parcel.description || 'Parcel'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(parcel.status)}`}>
                                        {parcel.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Pickup:</p>
                                        <p className="text-sm text-gray-900">{parcel.pickupAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Delivery:</p>
                                        <p className="text-sm text-gray-900">{parcel.deliveryAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Size:</p>
                                        <p className="text-sm text-gray-900">{parcel.parcelSize}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Payment:</p>
                                        <p className="text-sm text-gray-900">
                                            {parcel.paymentMethod === 'cod'
                                                ? `COD - ৳${parcel.codAmount}`
                                                : 'Prepaid'}
                                        </p>
                                    </div>
                                </div>

                                {selectedParcel?.id === parcel.id ? (
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Update Status:</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {getNextStatus(parcel.status).map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusUpdate(parcel.id, status)}
                                                    disabled={updateStatus.isPending}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition"
                                                >
                                                    Mark as {status.replace('_', ' ')}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setSelectedParcel(null)}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    getNextStatus(parcel.status).length > 0 && (
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => setSelectedParcelForMap(parcel)}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition"
                                            >
                                                🗺️ View Route
                                            </button>
                                            <button
                                                onClick={() => setSelectedParcel(parcel)}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                                            >
                                                Update Status
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Map Modal */}
                {selectedParcelForMap && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedParcelForMap(null)}>
                        <div className="bg-white rounded-lg max-w-4xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Route - {selectedParcelForMap.trackingNumber}</h3>
                                <button
                                    onClick={() => setSelectedParcelForMap(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <ParcelMap parcel={selectedParcelForMap} showRoute={true} height="500px" />
                            <button
                                onClick={() => setSelectedParcelForMap(null)}
                                className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AgentDashboard() {
    return (
        <ProtectedRoute allowedRoles={['delivery_agent']}>
            <AgentDashboardContent />
        </ProtectedRoute>
    );
}
