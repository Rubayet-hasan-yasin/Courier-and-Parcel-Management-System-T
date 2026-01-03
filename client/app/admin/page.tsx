'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParcels, useParcelStats, useLogout } from '@/lib/hooks';
import { getCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAdminUpdates } from '@/lib/socket';
import { showInfoToast } from '@/lib/toast';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function AdminDashboardContent() {
    const router = useRouter();
    const user = getCurrentUser();
    const { data: parcels, isLoading, refetch } = useParcels();
    const { data: stats } = useParcelStats();
    const logoutMutation = useLogout();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Real-time updates
    useAdminUpdates((data) => {
        showInfoToast(`New parcel booked: ${data.parcel.trackingNumber}`);
        refetch();
    });

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

    // Filter parcels
    const filteredParcels = parcels?.filter((parcel) => {
        const matchesSearch = searchTerm === '' ||
            parcel.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parcel.customer?.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || parcel.status === statusFilter;

        return matchesSearch && matchesStatus;
    }) || [];

    // Prepare chart data
    const statusData = stats?.byStatus ? Object.entries(stats.byStatus).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count as number,
    })) : [];

    const COLORS = ['#9CA3AF', '#3B82F6', '#FBBF24', '#10B981', '#EF4444'];

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                📦 Courier System
                            </Link>
                            <span className="text-sm text-gray-600">Admin Dashboard</span>
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
                <div className="mb-8 flex gap-3 flex-wrap">
                    <Link
                        href="/admin/users"
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition shadow-sm text-sm"
                    >
                        👥 Manage Users
                    </Link>
                    <Link
                        href="/admin/assign"
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition shadow-sm text-sm"
                    >
                        📋 Assign Agents
                    </Link>
                    <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/analytics/export/csv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition shadow-sm text-sm"
                    >
                        📊 Export CSV
                    </a>
                    <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/analytics/export/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition shadow-sm text-sm"
                    >
                        📄 Export PDF
                    </a>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <p className="text-sm text-gray-600 mb-1">Total Parcels</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <p className="text-sm text-gray-600 mb-1">Delivered</p>
                            <p className="text-3xl font-bold text-green-600">
                                {(stats.byStatus as any)?.delivered || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <p className="text-sm text-gray-600 mb-1">In Transit</p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {((stats.byStatus as any)?.picked_up || 0) + ((stats.byStatus as any)?.in_transit || 0)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <p className="text-sm text-gray-600 mb-1">Total COD</p>
                            <p className="text-3xl font-bold text-blue-600">৳{(stats as any).totalCOD || 0}</p>
                        </div>
                    </div>
                )}

                {stats && statusData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => entry.name}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcel Status Overview</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={statusData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search by tracking number, customer name, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Parcels ({filteredParcels.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <p className="p-6 text-gray-500">Loading...</p>
                        ) : filteredParcels.length === 0 ? (
                            <p className="p-6 text-gray-500">No parcels found.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tracking Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Route
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Agent
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredParcels.map((parcel: any) => (
                                        <tr key={parcel.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono text-gray-900">
                                                    {parcel.trackingNumber}
                                                </div>
                                                <div className="text-sm text-gray-500">{parcel.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{parcel.customer?.name}</div>
                                                <div className="text-sm text-gray-500">{parcel.customer?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                                    {parcel.pickupAddress}
                                                </div>
                                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                                    → {parcel.deliveryAddress}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                        parcel.status
                                                    )}`}
                                                >
                                                    {parcel.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {parcel.paymentMethod === 'cod'
                                                    ? `COD ৳${parcel.codAmount}`
                                                    : 'Prepaid'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {parcel.agent?.name || 'Not assigned'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}
