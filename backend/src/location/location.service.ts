import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { AddLocationDto } from './dto/add-location.dto';
import { ParcelService } from '../parcel/parcel.service';
import { UserRole } from '../user/enums/user-role.enum';

/**
 * Location Service
 * Handles location tracking for parcels
 */
@Injectable()
export class LocationService {
    constructor(
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
        private readonly parcelService: ParcelService,
    ) { }

    /**
     * Add a location update for a parcel
     */
    async addLocation(
        parcelId: number,
        addLocationDto: AddLocationDto,
        userId: number,
        userRole: UserRole,
    ): Promise<Location> {
        // Get parcel and validate access
        const parcel = await this.parcelService.findOne(parcelId);

        // Check if user has permission (Admin or assigned Agent)
        if (
            userRole === UserRole.DELIVERY_AGENT &&
            parcel.agentId !== userId
        ) {
            throw new ForbiddenException(
                'You can only update location for your assigned parcels',
            );
        }

        // Create location record
        const location = this.locationRepository.create({
            parcelId,
            ...addLocationDto,
        });

        // Also update the parcel's current location
        await this.parcelService.updateLocation(
            parcelId,
            addLocationDto.latitude,
            addLocationDto.longitude,
            userId,
        );

        return this.locationRepository.save(location);
    }

    /**
     * Get location history for a parcel
     */
    async getHistory(parcelId: number): Promise<Location[]> {
        // Verify parcel exists
        await this.parcelService.findOne(parcelId);

        return this.locationRepository.find({
            where: { parcelId },
            order: { timestamp: 'DESC' },
        });
    }

    /**
     * Get latest location for a parcel
     */
    async getLatest(parcelId: number): Promise<Location | null> {
        await this.parcelService.findOne(parcelId);

        return this.locationRepository.findOne({
            where: { parcelId },
            order: { timestamp: 'DESC' },
        });
    }
}
