import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Events Gateway
 * Handles real-time WebSocket communication for parcel tracking
 */
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger('EventsGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinParcel')
    handleJoinParcel(client: Socket, parcelId: number) {
        const room = `parcel:${parcelId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        return { event: 'joined', data: { parcelId, room } };
    }

    @SubscribeMessage('leaveParcel')
    handleLeaveParcel(client: Socket, parcelId: number) {
        const room = `parcel:${parcelId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} left room ${room}`);
        return { event: 'left', data: { parcelId, room } };
    }

    emitStatusUpdate(parcelId: number, status: string, parcel: any) {
        const room = `parcel:${parcelId}`;
        const payload = {
            parcelId,
            status,
            timestamp: new Date(),
            parcel,
        };

        this.server.to(room).emit('statusUpdate', payload);

        this.server.to('admin').emit('statusUpdate', payload);

        if (parcel.customerId) {
            this.emitToCustomer(parcel.customerId, 'statusUpdate', payload);
        }

        this.logger.log(`Emitted status update to room ${room}, admin, and customer`);
    }

    emitLocationUpdate(
        parcelId: number,
        location: { latitude: number; longitude: number; address?: string },
    ) {
        const room = `parcel:${parcelId}`;
        this.server.to(room).emit('locationUpdate', {
            parcelId,
            location,
            timestamp: new Date(),
        });
        this.logger.log(`Emitted location update to room ${room}`);
    }

    emitAgentAssigned(parcelId: number, agent: any, parcel: any) {
        const room = `parcel:${parcelId}`;
        const payload = {
            parcelId,
            agent,
            timestamp: new Date(),
        };

        this.server.to(room).emit('agentAssigned', payload);

        this.server.to('admin').emit('agentAssigned', payload);

        if (parcel.customerId) {
            this.emitToCustomer(parcel.customerId, 'agentAssigned', payload);
        }

        this.logger.log(`Emitted agent assignment to room ${room}, admin, and customer`);
    }

    emitNewParcel(parcel: any) {
        this.server.to('admin').emit('newParcel', {
            parcel,
            timestamp: new Date(),
        });

        if (parcel.customerId) {
            this.emitToCustomer(parcel.customerId, 'newParcel', {
                parcel,
                timestamp: new Date(),
            });
        }

        this.logger.log('Emitted new parcel to admin room and customer');
    }

    @SubscribeMessage('joinAdmin')
    handleJoinAdmin(client: Socket) {
        client.join('admin');
        this.logger.log(`Client ${client.id} joined admin room`);
        return { event: 'joined', data: { room: 'admin' } };
    }

    @SubscribeMessage('joinCustomer')
    handleJoinCustomer(client: Socket, customerId: number) {
        const room = `customer:${customerId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        return { event: 'joined', data: { customerId, room } };
    }

    @SubscribeMessage('leaveCustomer')
    handleLeaveCustomer(client: Socket, customerId: number) {
        const room = `customer:${customerId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} left room ${room}`);
        return { event: 'left', data: { customerId, room } };
    }

    emitToCustomer(customerId: number, event: string, data: any) {
        const room = `customer:${customerId}`;
        this.server.to(room).emit(event, data);
        this.logger.log(`Emitted ${event} to customer room ${room}`);
    }
}
