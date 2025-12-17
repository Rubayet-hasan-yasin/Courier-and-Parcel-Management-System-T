import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel } from './entities/parcel.entity';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { ParcelStatus } from './enums/parcel-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { UserRole } from '../user/enums/user-role.enum';

import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ParcelService {
  constructor(
    @InjectRepository(Parcel)
    private readonly parcelRepository: Repository<Parcel>,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationService: NotificationService,
  ) { }

  private generateTrackingNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CPM-${timestamp}-${random}`.toUpperCase();
  }

  async create(
    createParcelDto: CreateParcelDto,
    customerId: number,
  ): Promise<Parcel> {
    if (
      createParcelDto.paymentMethod === PaymentMethod.COD &&
      !createParcelDto.codAmount
    ) {
      throw new BadRequestException(
        'COD amount is required for Cash on Delivery',
      );
    }

    const trackingNumber = this.generateTrackingNumber();

    const parcel = this.parcelRepository.create({
      ...createParcelDto,
      trackingNumber,
      customerId,
      status: ParcelStatus.PENDING,
    });

    const savedParcel = await this.parcelRepository.save(parcel);

    const fullParcel = await this.findOne(savedParcel.id);

    this.eventsGateway.emitNewParcel(savedParcel);

    return savedParcel;
  }

  async findAll(filters?: {
    status?: ParcelStatus;
    customerId?: number;
    agentId?: number;
  }): Promise<Parcel[]> {
    const query = this.parcelRepository.createQueryBuilder('parcel');

    if (filters?.status) {
      query.andWhere('parcel.status = :status', { status: filters.status });
    }

    if (filters?.customerId) {
      query.andWhere('parcel.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.agentId) {
      query.andWhere('parcel.agentId = :agentId', {
        agentId: filters.agentId,
      });
    }

    return query
      .leftJoinAndSelect('parcel.customer', 'customer')
      .leftJoinAndSelect('parcel.agent', 'agent')
      .orderBy('parcel.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Parcel> {
    const parcel = await this.parcelRepository.findOne({
      where: { id },
      relations: ['customer', 'agent'],
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel with ID ${id} not found`);
    }

    return parcel;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Parcel> {
    const parcel = await this.parcelRepository.findOne({
      where: { trackingNumber },
      relations: ['customer', 'agent'],
    });

    if (!parcel) {
      throw new NotFoundException(
        `Parcel with tracking number ${trackingNumber} not found`,
      );
    }

    return parcel;
  }

  async getBookingHistory(customerId: number): Promise<Parcel[]> {
    return this.findAll({ customerId });
  }

  async getAssignedParcels(agentId: number): Promise<Parcel[]> {
    return this.findAll({ agentId });
  }

  async update(id: number, updateParcelDto: UpdateParcelDto): Promise<Parcel> {
    const parcel = await this.findOne(id);

    Object.assign(parcel, updateParcelDto);

    return this.parcelRepository.save(parcel);
  }

  async assignAgent(
    id: number,
    assignAgentDto: AssignAgentDto,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id);

    if (
      parcel.status === ParcelStatus.DELIVERED ||
      parcel.status === ParcelStatus.FAILED
    ) {
      throw new BadRequestException(
        `Cannot assign agent to ${parcel.status} parcel`,
      );
    }

    parcel.agentId = assignAgentDto.agentId;

    const savedParcel = await this.parcelRepository.save(parcel);

    const updatedParcel = await this.findOne(id);
    this.eventsGateway.emitAgentAssigned(id, updatedParcel.agent, updatedParcel);
    this.eventsGateway.emitStatusUpdate(id, parcel.status, updatedParcel);

    return savedParcel;
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateStatusDto,
    userId: number,
    userRole: UserRole,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id);

    console.log(id)
    console.log(updateStatusDto)
    console.log(userId)
    console.log(userRole)

    if (
      userRole === UserRole.DELIVERY_AGENT &&
      parcel.agentId !== userId
    ) {
      throw new ForbiddenException(
        'You can only update status of your assigned parcels',
      );
    }

    this.validateStatusTransition(parcel.status, updateStatusDto.status);

    parcel.status = updateStatusDto.status;

    if (updateStatusDto.status === ParcelStatus.PICKED_UP) {
      parcel.pickedUpAt = new Date();
    } else if (updateStatusDto.status === ParcelStatus.DELIVERED) {
      parcel.deliveredAt = new Date();
    } else if (updateStatusDto.status === ParcelStatus.FAILED) {
      parcel.failureReason =
        updateStatusDto.failureReason || 'No reason provided';
    }

    const savedParcel = await this.parcelRepository.save(parcel);

    const updatedParcel = await this.findOne(id);

    this.eventsGateway.emitStatusUpdate(id, savedParcel.status, updatedParcel);

    return savedParcel;
  }

  async updateLocation(
    id: number,
    latitude: number,
    longitude: number,
    userId: number,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id);

    if (parcel.agentId !== userId) {
      throw new ForbiddenException(
        'You can only update location of your assigned parcels',
      );
    }

    parcel.currentLatitude = latitude;
    parcel.currentLongitude = longitude;

    const savedParcel = await this.parcelRepository.save(parcel);

    this.eventsGateway.emitLocationUpdate(id, {
      latitude: savedParcel.currentLatitude,
      longitude: savedParcel.currentLongitude,
    });

    return savedParcel;
  }

  async remove(id: number): Promise<void> {
    const parcel = await this.findOne(id);
    await this.parcelRepository.remove(parcel);
  }

  private validateStatusTransition(
    currentStatus: ParcelStatus,
    newStatus: ParcelStatus,
  ): void {
    const validTransitions: Record<ParcelStatus, ParcelStatus[]> = {
      [ParcelStatus.PENDING]: [
        ParcelStatus.PICKED_UP,
        ParcelStatus.FAILED,
      ],
      [ParcelStatus.PICKED_UP]: [
        ParcelStatus.IN_TRANSIT,
        ParcelStatus.FAILED,
      ],
      [ParcelStatus.IN_TRANSIT]: [
        ParcelStatus.DELIVERED,
        ParcelStatus.FAILED,
      ],
      [ParcelStatus.DELIVERED]: [],
      [ParcelStatus.FAILED]: [ParcelStatus.PENDING],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<ParcelStatus, number>;
    totalCOD: number;
  }> {
    const parcels = await this.parcelRepository.find();

    const stats = {
      total: parcels.length,
      byStatus: {
        [ParcelStatus.PENDING]: 0,
        [ParcelStatus.PICKED_UP]: 0,
        [ParcelStatus.IN_TRANSIT]: 0,
        [ParcelStatus.DELIVERED]: 0,
        [ParcelStatus.FAILED]: 0,
      },
      totalCOD: 0,
    };

    parcels.forEach((parcel) => {
      stats.byStatus[parcel.status]++;
      if (
        parcel.paymentMethod === PaymentMethod.COD &&
        parcel.codAmount
      ) {
        stats.totalCOD += Number(parcel.codAmount);
      }
    });

    return stats;
  }
}
