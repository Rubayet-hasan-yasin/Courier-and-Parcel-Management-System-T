'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

let socket: Socket | null = null;

export function initSocket(): Socket {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

    useEffect(() => {
        const s = initSocket();
        setSocketInstance(s);

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);

        return () => {
            s.off('connect', onConnect);
            s.off('disconnect', onDisconnect);
        };
    }, []);

    return { socket: socketInstance, isConnected };
}

export function useParcelTracking(parcelId: number | null, onUpdate?: (data: any) => void) {
    const { socket, isConnected } = useSocket();
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        if (!socket || !isConnected || !parcelId) return;

        socket.emit('joinParcel', parcelId);

        const handleStatusUpdate = (data: any) => {
            console.log('📦 Status update:', data);
            setUpdates(prev => [...prev, { type: 'status', ...data }]);
            onUpdate?.(data);
        };

        const handleLocationUpdate = (data: any) => {
            console.log('📍 Location update:', data);
            setUpdates(prev => [...prev, { type: 'location', ...data }]);
            onUpdate?.(data);
        };

        const handleAgentAssigned = (data: any) => {
            console.log('👤 Agent assigned:', data);
            setUpdates(prev => [...prev, { type: 'agent', ...data }]);
            onUpdate?.(data);
        };

        socket.on('statusUpdate', handleStatusUpdate);
        socket.on('locationUpdate', handleLocationUpdate);
        socket.on('agentAssigned', handleAgentAssigned);

        return () => {
            socket.emit('leaveParcel', parcelId);
            socket.off('statusUpdate', handleStatusUpdate);
            socket.off('locationUpdate', handleLocationUpdate);
            socket.off('agentAssigned', handleAgentAssigned);
        };
    }, [socket, isConnected, parcelId, onUpdate]);

    return { updates, isConnected };
}

export function useAdminUpdates(onNewParcel?: (data: any) => void) {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected) return;

        socket.emit('joinAdmin');

        const handleNewParcel = (data: any) => {
            console.log('🆕 New parcel:', data);
            onNewParcel?.(data);
        };

        const handleStatusUpdate = (data: any) => {
            console.log('📦 Admin status update:', data);
            onNewParcel?.({ type: 'status_update', ...data });
        };

        const handleAgentAssigned = (data: any) => {
            console.log('👤 Admin agent assigned:', data);
            onNewParcel?.({ type: 'agent_assigned', ...data });
        };

        socket.on('newParcel', handleNewParcel);
        socket.on('statusUpdate', handleStatusUpdate);
        socket.on('agentAssigned', handleAgentAssigned);

        return () => {
            socket.off('newParcel', handleNewParcel);
            socket.off('statusUpdate', handleStatusUpdate);
            socket.off('agentAssigned', handleAgentAssigned);
        };
    }, [socket, isConnected, onNewParcel]);

    return { isConnected };
}

export function useCustomerUpdates(customerId: number | undefined, onUpdate?: (data: any) => void) {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected || !customerId) return;

        socket.emit('joinCustomer', customerId);

        const handleNewParcel = (data: any) => {
            console.log('🆕 My new parcel:', data);
            onUpdate?.({ type: 'new_parcel', ...data });
        };

        const handleStatusUpdate = (data: any) => {
            console.log('📦 My parcel status update:', data);
            onUpdate?.({ type: 'status_update', ...data });
        };

        socket.on('newParcel', handleNewParcel);
        socket.on('statusUpdate', handleStatusUpdate);

        return () => {
            socket.emit('leaveCustomer', customerId);
            socket.off('newParcel', handleNewParcel);
            socket.off('statusUpdate', handleStatusUpdate);
        };
    }, [socket, isConnected, customerId, onUpdate]);

    return { isConnected };
}
