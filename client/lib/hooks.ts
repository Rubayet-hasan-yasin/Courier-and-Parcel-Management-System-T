import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from './api';

export const authService = {
    login: (data: { email: string; password: string }) =>
        api.post<{
            access_token: string;
            user: any;
            message: string;
        }>('/auth/login', data),

    register: (data: {
        name: string;
        email: string;
        password: string;
        role?: string;
        phone?: string;
        address?: string;
    }) => api.post('/auth/register', data),

    logout: () => api.post('/auth/logout'),
};

export const userService = {
    getAll: (role?: string) => api.get(`/users${role ? `?role=${role}` : ''}`),
    getById: (id: number) => api.get(`/users/${id}`),
    update: (id: number, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
    toggleStatus: (id: number) => api.patch(`/users/${id}/toggle-status`),
};

export const parcelService = {
    create: (data: any) => api.post('/parcels', data),
    getAll: <T>(status?: string) => api.get<T>(`/parcels${status ? `?status=${status}` : ''}`),
    getById: <T>(id: number) => api.get<T>(`/parcels/${id}`),
    getMyBookings: <T>() => api.get<T>('/parcels/my-bookings'),
    getAssigned: <T>() => api.get<T>('/parcels/assigned'),
    trackByNumber: <T>(trackingNumber: string) => api.get<T>(`/parcels/track/${trackingNumber}`),
    update: (id: number, data: any) => api.patch(`/parcels/${id}`, data),
    assignAgent: (id: number, agentId: number) =>
        api.patch(`/parcels/${id}/assign`, { agentId }),
    updateStatus: (id: number, status: string, failureReason?: string) =>
        api.patch(`/parcels/${id}/status`, { status, failureReason }),
    updateLocation: (id: number, latitude: number, longitude: number) =>
        api.patch(`/parcels/${id}/location`, { latitude, longitude }),
    getStats: <T>() => api.get<T>('/parcels/stats'),
    delete: (id: number) => api.delete(`/parcels/${id}`),
};

export const locationService = {
    addLocation: (
        parcelId: number,
        data: { latitude: number; longitude: number; address?: string; notes?: string }
    ) => api.post(`/location/${parcelId}`, data),
    getHistory: (parcelId: number) => api.get(`/location/${parcelId}/history`),
    getLatest: (parcelId: number) => api.get(`/location/${parcelId}/latest`),
};

export const qrCodeService = {
    generate: (parcelId: number) => api.get<{ qrCode: string; trackingNumber: string }>(`/qrcode/generate/${parcelId}`),
    validate: (qrData: string) => api.post('/qrcode/validate', { qrData }),
    confirmPickup: (qrData: string) => api.post('/qrcode/confirm-pickup', { qrData }),
    confirmDelivery: (qrData: string) => api.post('/qrcode/confirm-delivery', { qrData }),
};

export const useLogin = () => {
    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
        },
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: authService.register,
    });
};

export const useLogout = () => {
    return useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        },
    });
};

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string;
    address?: string;
}

export interface Parcel {
    id: number;
    trackingNumber: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    customer?: User;
    agent?: User;
    createdAt: string;
    updatedAt: string;
    description?: string;
    parcelSize: string;
    parcelType: string;
    paymentMethod: string;
    totalAmount: number;
    weight?: number;
    deliveredAt?: string;
    pickedUpAt?: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
}

export interface ParcelStats {
    total: number;
    byStatus: Record<string, number>;
    revenue: number;
}

export const useParcels = (status?: string) => {
    return useQuery({
        queryKey: ['parcels', status],
        queryFn: () => parcelService.getAll<Parcel[]>(status),
    });
};

export const useParcel = (id: number) => {
    return useQuery({
        queryKey: ['parcel', id],
        queryFn: () => parcelService.getById<Parcel>(id),
        enabled: !!id,
    });
};

export const useMyBookings = () => {
    return useQuery({
        queryKey: ['my-bookings'],
        queryFn: () => parcelService.getMyBookings<Parcel[]>(),
    });
};

export const useAssignedParcels = () => {
    return useQuery({
        queryKey: ['assigned-parcels'],
        queryFn: () => parcelService.getAssigned<Parcel[]>(),
    });
};

export const useTrackParcel = (trackingNumber: string) => {
    return useQuery({
        queryKey: ['track-parcel', trackingNumber],
        queryFn: () => parcelService.trackByNumber<Parcel>(trackingNumber),
        enabled: !!trackingNumber && trackingNumber.length > 5,
    });
};

export const useParcelStats = () => {
    return useQuery({
        queryKey: ['parcel-stats'],
        queryFn: () => parcelService.getStats<ParcelStats>(),
    });
};

export const useCreateParcel = () => {
    return useMutation({
        mutationFn: parcelService.create,
    });
};

export const useUpdateParcelStatus = () => {
    return useMutation({
        mutationFn: ({ id, status, failureReason }: { id: number; status: string; failureReason?: string }) =>
            parcelService.updateStatus(id, status, failureReason),
    });
};

export const useAssignAgent = () => {
    return useMutation({
        mutationFn: ({ parcelId, agentId }: { parcelId: number; agentId: number }) =>
            parcelService.assignAgent(parcelId, agentId),
    });
};

export const useLocationHistory = (parcelId: number) => {
    return useQuery({
        queryKey: ['location-history', parcelId],
        queryFn: () => locationService.getHistory(parcelId),
        enabled: !!parcelId,
    });
};

export const useAddLocation = () => {
    return useMutation({
        mutationFn: ({
            parcelId,
            data,
        }: {
            parcelId: number;
            data: { latitude: number; longitude: number; address?: string; notes?: string };
        }) => locationService.addLocation(parcelId, data),
    });
};

export const useGenerateQR = () => {
    return useMutation({
        mutationFn: qrCodeService.generate,
    });
};

export const useValidateQR = () => {
    return useMutation({
        mutationFn: qrCodeService.validate,
    });
};
