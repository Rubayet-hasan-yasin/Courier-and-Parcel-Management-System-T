'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLogout } from '@/lib/hooks';
import { getCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
}

function UsersManagementContent() {
    const router = useRouter();
    const user = getCurrentUser();
    const queryClient = useQueryClient();
    const logoutMutation = useLogout();
    const [selectedRole, setSelectedRole] = useState<string>('all');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users', selectedRole],
        queryFn: () => api.get<User[]>(`/users${selectedRole !== 'all' ? `?role=${selectedRole}` : ''}`),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (userId: number) => api.patch(`/users/${userId}/toggle-status`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccessToast('User status updated!');
        },
        onError: (error: any) => {
            showErrorToast(error.message || 'Failed to update user status');
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => api.delete(`/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccessToast('User deleted!');
        },
        onError: (error: any) => {
            showErrorToast(error.message || 'Failed to delete user');
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: number; role: string }) =>
            api.patch(`/users/${userId}/role`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccessToast('User role updated successfully!');
        },
        onError: (error: any) => {
            showErrorToast(error.message || 'Failed to update user role');
        },
    });

    const handleRoleChange = (userId: number, newRole: string) => {
        if (confirm(`Are you sure you want to change this user's role to ${newRole.replace('_', ' ')}?`)) {
            updateRoleMutation.mutate({ userId, role: newRole });
        }
    };

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
        router.push('/login');
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700',
            delivery_agent: 'bg-blue-100 text-blue-700',
            customer: 'bg-green-100 text-green-700',
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/admin" className="text-xl font-bold text-gray-900">
                                📦 Courier System
                            </Link>
                            <span className="text-sm text-gray-600">User Management</span>
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
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedRole('all')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedRole === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setSelectedRole('customer')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedRole === 'customer'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Customers
                        </button>
                        <button
                            onClick={() => setSelectedRole('delivery_agent')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${selectedRole === 'delivery_agent'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Agents
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <p className="p-6 text-gray-500">Loading users...</p>
                    ) : !users || users.length === 0 ? (
                        <p className="p-6 text-gray-500">No users found.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.id === user?.id || updateRoleMutation.isPending}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getRoleBadge(u.role)}`}
                                                style={{ WebkitAppearance: 'none', MozAppearance: 'none', textAlign: 'center' }}
                                            >
                                                <option value="customer" className="bg-white text-gray-900">Customer</option>
                                                <option value="delivery_agent" className="bg-white text-gray-900">Delivery Agent</option>
                                                <option value="admin" className="bg-white text-gray-900">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {u.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => toggleStatusMutation.mutate(u.id)}
                                                disabled={toggleStatusMutation.isPending}
                                                className="text-blue-600 hover:text-blue-700 mr-3 disabled:opacity-50"
                                            >
                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            {u.id !== user?.id && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this user?')) {
                                                            deleteUserMutation.mutate(u.id);
                                                        }
                                                    }}
                                                    disabled={deleteUserMutation.isPending}
                                                    className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UsersManagement() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <UsersManagementContent />
        </ProtectedRoute>
    );
}
