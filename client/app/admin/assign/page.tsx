'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLogout } from '@/lib/hooks';
import { useAdminUpdates } from '@/lib/socket';
import { getCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface Parcel {
    id: number;
    trackingNumber: string;
    pickupAddress: string;
    deliveryAddress: string;
    status: string;
    description?: string;
    agent?: { id: number; name: string };
    customer?: { name: string };
}

interface Agent {
    id: number;
    name: string;
    email: string;
    phone?: string;
}

function AssignAgentsContent() {
    const router = useRouter();
    const user = getCurrentUser();
    const queryClient = useQueryClient();
    const logoutMutation = useLogout();
    const [selectedParcel, setSelectedParcel] = useState<number | null>(null);

    useAdminUpdates((data) => {
        queryClient.invalidateQueries({ queryKey: ['parcels'] });
    });

    const { data: parcels, isLoading: parcelsLoading } = useQuery({
        queryKey: ['parcels'],
        queryFn: () => api.get<Parcel[]>('/parcels'),
    });

    const { data: agents, isLoading: agentsLoading } = useQuery({
        queryKey: ['agents'],
        queryFn: () => api.get<Agent[]>('/users/agents'),
    });

    const assignMutation = useMutation({
        mutationFn: ({ parcelId, agentId }: { parcelId: number; agentId: number }) =>
            api.patch(`/parcels/${parcelId}/assign`, { agentId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parcels'] });
            setSelectedParcel(null);
            showSuccessToast('Agent assigned successfully!');
        },
        onError: (error: any) => {
            showErrorToast(error.message || 'Failed to assign agent');
        },
    });

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
        router.push('/login');
    };

    const handleAssign = (parcelId: number, agentId: number) => {
        if (confirm('Assign this agent to the parcel?')) {
            assignMutation.mutate({ parcelId, agentId });
        }
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

    const unassignedParcels = parcels?.filter((p) => !p.agent) || [];
    const assignedParcels = parcels?.filter((p) => p.agent) || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/admin" className="text-xl font-bold text-gray-900">
                                📦 Courier System
                            </Link>
                            <span className="text-sm text-gray-600">Agent Assignment</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                                ← Back to Dashboard
                            </Link>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-1">Unassigned Parcels</p>
                        <p className="text-3xl font-bold text-red-600">{unassignedParcels.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-1">Assigned Parcels</p>
                        <p className="text-3xl font-bold text-green-600">{assignedParcels.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-1">Available Agents</p>
                        <p className="text-3xl font-bold text-blue-600">{agents?.length || 0}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Unassigned Parcels</h2>
                    </div>
                    <div className="p-6">
                        {parcelsLoading || agentsLoading ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : unassignedParcels.length === 0 ? (
                            <p className="text-gray-500">All parcels have been assigned!</p>
                        ) : (
                            <div className="space-y-4">
                                {unassignedParcels.map((parcel) => (
                                    <div
                                        key={parcel.id}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-mono text-sm text-gray-600 mb-1">
                                                    {parcel.trackingNumber}
                                                </p>
                                                <p className="text-sm text-gray-900">Customer: {parcel.customer?.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{parcel.description}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(parcel.status)}`}>
                                                {parcel.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">From:</p>
                                                <p className="text-gray-900">{parcel.pickupAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">To:</p>
                                                <p className="text-gray-900">{parcel.deliveryAddress}</p>
                                            </div>
                                        </div>

                                        {selectedParcel === parcel.id ? (
                                            <div className="border-t border-gray-200 pt-3 mt-3">
                                                <p className="text-sm font-medium text-gray-700 mb-3">Select Agent:</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    {agents?.map((agent) => (
                                                        <button
                                                            key={agent.id}
                                                            onClick={() => handleAssign(parcel.id, agent.id)}
                                                            disabled={assignMutation.isPending}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 transition text-left"
                                                        >
                                                            <div className="font-medium">{agent.name}</div>
                                                            <div className="text-xs opacity-80">{agent.phone}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setSelectedParcel(null)}
                                                    className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedParcel(parcel.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                                            >
                                                Assign Agent
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Recently Assigned</h2>
                    </div>
                    <div className="p-6">
                        {assignedParcels.length === 0 ? (
                            <p className="text-gray-500">No assigned parcels yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {assignedParcels.slice(0, 5).map((parcel) => (
                                    <div
                                        key={parcel.id}
                                        className="flex justify-between items-center border-b border-gray-100 pb-3"
                                    >
                                        <div>
                                            <p className="font-mono text-sm text-gray-900">
                                                {parcel.trackingNumber}
                                            </p>
                                            <p className="text-xs text-gray-500">{parcel.customer?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {parcel.agent?.name}
                                            </p>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(parcel.status)}`}>
                                                {parcel.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AssignAgents() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AssignAgentsContent />
        </ProtectedRoute>
    );
}
