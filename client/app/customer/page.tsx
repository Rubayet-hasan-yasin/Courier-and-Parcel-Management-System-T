'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateParcel, useMyBookings, useLogout, useGenerateQR } from '@/lib/hooks';
import { useCustomerUpdates } from '@/lib/socket';
import { getCurrentUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

const parcelSchema = z.object({
    pickupAddress: z.string().min(5, 'Pickup address required'),
    pickupLatitude: z.number().optional(),
    pickupLongitude: z.number().optional(),
    deliveryAddress: z.string().min(5, 'Delivery address required'),
    deliveryLatitude: z.number().optional(),
    deliveryLongitude: z.number().optional(),
    parcelSize: z.enum(['small', 'medium', 'large', 'extra_large']),
    parcelType: z.enum(['document', 'package', 'fragile', 'electronics', 'food', 'other']),
    description: z.string().optional(),
    weight: z.number().min(0).optional(),
    paymentMethod: z.enum(['cod', 'prepaid']),
    codAmount: z.number().min(0).optional(),
    deliveryCharge: z.number().min(0).optional(),
});

type ParcelForm = z.infer<typeof parcelSchema>;

function CustomerDashboardContent() {
    const router = useRouter();
    // Use state for user to ensure it's available after hydration
    const [user, setUser] = useState<any>(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const u = getCurrentUser();
        setUser(u);
    }, []);

    const [qrImage, setQrImage] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);

    const { data: bookings, isLoading, refetch } = useMyBookings();

    // Real-time updates
    useCustomerUpdates(user?.id, (data) => {
        // Refetch bookings on any update
        refetch();
    });

    const createParcel = useCreateParcel();
    const generateQR = useGenerateQR();
    const logoutMutation = useLogout();

    const handleShowQR = async (parcelId: number) => {
        try {
            const data = await generateQR.mutateAsync(parcelId);
            setQrImage(data.qrCode);
            setShowQRModal(true);
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to generate QR code');
        }
    };

    // Filter bookings
    const filteredBookings = bookings?.filter((booking: any) => {
        const matchesSearch = searchTerm === '' ||
            booking.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

        return matchesSearch && matchesStatus;
    }) || [];

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<ParcelForm>({
        resolver: zodResolver(parcelSchema),
        defaultValues: {
            parcelSize: 'medium',
            parcelType: 'package',
            paymentMethod: 'prepaid',
        },
    });

    const paymentMethod = watch('paymentMethod');

    const onSubmit = async (data: ParcelForm) => {
        try {
            await createParcel.mutateAsync(data);
            showSuccessToast('Parcel booked successfully!');
            reset();
            setShowBookingForm(false);
            refetch();
        } catch (error: any) {
            showErrorToast(error.message || 'Failed to book parcel');
        }
    };

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                📦 Courier System
                            </Link>
                            <span className="text-sm text-gray-600">Customer Dashboard</span>
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
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">My Parcels</h1>
                    <button
                        onClick={() => setShowBookingForm(!showBookingForm)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                        {showBookingForm ? 'Cancel' : '+ Book New Parcel'}
                    </button>
                </div>

                {showBookingForm && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Book New Parcel</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pickup Address *
                                </label>
                                <textarea
                                    {...register('pickupAddress')}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="123 Main St, Dhaka"
                                />
                                {errors.pickupAddress && (
                                    <p className="mt-1 text-sm text-red-600">{errors.pickupAddress.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Address *
                                </label>
                                <textarea
                                    {...register('deliveryAddress')}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="456 Park Ave, Chittagong"
                                />
                                {errors.deliveryAddress && (
                                    <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parcel Size</label>
                                <select
                                    {...register('parcelSize')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="small">Small (up to 1kg)</option>
                                    <option value="medium">Medium (1-5kg)</option>
                                    <option value="large">Large (5-15kg)</option>
                                    <option value="extra_large">Extra Large (15kg+)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parcel Type</label>
                                <select
                                    {...register('parcelType')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="document">Document</option>
                                    <option value="package">Package</option>
                                    <option value="fragile">Fragile</option>
                                    <option value="electronics">Electronics</option>
                                    <option value="food">Food</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <input
                                    {...register('description')}
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mobile phone, books, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                                <input
                                    {...register('weight', { valueAsNumber: true })}
                                    type="number"
                                    step="0.1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="2.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                <select
                                    {...register('paymentMethod')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="prepaid">Prepaid</option>
                                    <option value="cod">Cash on Delivery (COD)</option>
                                </select>
                            </div>

                            {paymentMethod === 'cod' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">COD Amount *</label>
                                    <input
                                        {...register('codAmount', { valueAsNumber: true })}
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="5000"
                                    />
                                    {errors.codAmount && (
                                        <p className="mt-1 text-sm text-red-600">{errors.codAmount.message}</p>
                                    )}
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={createParcel.isPending}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition"
                                >
                                    {createParcel.isPending ? 'Booking...' : 'Book Parcel'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">My Bookings ({filteredBookings.length})</h2>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Search by tracking number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                    </div>
                    <div className="p-6">
                        {isLoading ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : filteredBookings.length === 0 ? (
                            <p className="text-gray-500">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'No bookings match your search criteria.'
                                    : 'No parcels booked yet.'}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {filteredBookings.map((parcel: any) => (
                                    <div
                                        key={parcel.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-mono text-sm text-gray-600">
                                                    Tracking: {parcel.trackingNumber}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">{parcel.description || 'No description'}</p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${parcel.status === 'delivered'
                                                    ? 'bg-green-100 text-green-700'
                                                    : parcel.status === 'failed'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}
                                            >
                                                {parcel.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">From:</p>
                                                <p className="text-gray-900">{parcel.pickupAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">To:</p>
                                                <p className="text-gray-900">{parcel.deliveryAddress}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                            <button
                                                onClick={() => handleShowQR(parcel.id)}
                                                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
                                            >
                                                <span>📱</span> Show QR Code
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showQRModal && qrImage && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
                    <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Parcel QR Code</h3>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-4">
                            <img src={qrImage} alt="Parcel QR Code" className="w-64 h-64 object-contain" />
                        </div>
                        <p className="text-sm text-gray-600">
                            Show this QR code to the delivery agent for pickup or delivery confirmation.
                        </p>
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CustomerDashboard() {
    return (
        <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboardContent />
        </ProtectedRoute>
    );
}
