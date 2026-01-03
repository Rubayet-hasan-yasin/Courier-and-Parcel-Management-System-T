import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Client, TravelMode, DirectionsResponse } from '@googlemaps/google-maps-services-js';
import { EnvConfig } from '../helper/config/env.config';
import { Parcel } from '../parcel/entities/parcel.entity';
import { ParcelStatus } from '../parcel/enums/parcel-status.enum';

/**
 * Google Maps Service
 * Handles route optimization and distance calculations
 */
@Injectable()
export class MapsService {
    private client: Client;
    private logger = new Logger('MapsService');

    constructor(
        @InjectRepository(Parcel)
        private readonly parcelRepository: Repository<Parcel>,
    ) {
        this.client = new Client({});
    }

    /**
     * Validate coordinate input
     */
    private validateCoordinate(lat: number, lng: number, label: string): void {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new BadRequestException(`${label} coordinates must be numbers`);
        }
        if (isNaN(lat) || isNaN(lng)) {
            throw new BadRequestException(`${label} coordinates contain invalid values`);
        }
        if (lat < -90 || lat > 90) {
            throw new BadRequestException(`${label} latitude must be between -90 and 90`);
        }
        if (lng < -180 || lng > 180) {
            throw new BadRequestException(`${label} longitude must be between -180 and 180`);
        }
    }

    /**
     * Get optimized route for delivery agent
     * @param origin Starting point (agent's current location)
     * @param waypoints Array of delivery addresses
     * @param destination Final destination
     */
    async getOptimizedRoute(
        origin: { lat: number; lng: number },
        waypoints: Array<{ lat: number; lng: number }>,
        destination?: { lat: number; lng: number },
    ): Promise<any> {
        try {
            // Validate inputs
            this.validateCoordinate(origin.lat, origin.lng, 'Origin');
            waypoints.forEach((wp, index) => {
                this.validateCoordinate(wp.lat, wp.lng, `Waypoint ${index + 1}`);
            });
            if (destination) {
                this.validateCoordinate(destination.lat, destination.lng, 'Destination');
            }

            // Check waypoint limit (Google Maps allows max 25 waypoints)
            if (waypoints.length > 25) {
                throw new BadRequestException('Maximum 25 waypoints allowed for route optimization');
            }

            if (waypoints.length === 0) {
                throw new BadRequestException('At least one waypoint is required');
            }

            const waypointStrings = waypoints.map((wp) => `${wp.lat},${wp.lng}`);

            const response = await this.client.directions({
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: destination
                        ? `${destination.lat},${destination.lng}`
                        : waypoints[waypoints.length - 1]
                            ? `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`
                            : `${origin.lat},${origin.lng}`,
                    waypoints: waypointStrings,
                    optimize: true,
                    mode: TravelMode.driving,
                    key: EnvConfig.GMAP_API_KEY,
                },
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Google Maps API error: ${response.data.status}`);
            }

            // Extract optimized waypoint order
            const waypointOrder = response.data.routes[0]?.waypoint_order || [];

            // Calculate total distance and duration
            let totalDistance = 0;
            let totalDuration = 0;
            response.data.routes[0]?.legs.forEach(leg => {
                totalDistance += leg.distance.value; // in meters
                totalDuration += leg.duration.value; // in seconds
            });

            this.logger.log('Route optimized successfully');

            return {
                status: 'success',
                route: response.data,
                summary: {
                    totalDistance: `${(totalDistance / 1000).toFixed(2)} km`,
                    totalDistanceMeters: totalDistance,
                    totalDuration: `${Math.round(totalDuration / 60)} minutes`,
                    totalDurationSeconds: totalDuration,
                    optimizedWaypointOrder: waypointOrder,
                    numberOfWaypoints: waypoints.length,
                },
            };
        } catch (error) {
            this.logger.error('Failed to get optimized route:', error.message);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to calculate optimized route: ${error.message}`);
        }
    }

    /**
     * Get optimized route for agent's assigned parcels
     * @param agentId Agent ID
     * @param currentLocation Agent's current location
     */
    async getAgentOptimizedRoute(
        agentId: number,
        currentLocation?: { lat: number; lng: number },
    ): Promise<any> {
        try {
            // Get all active parcels for the agent
            const parcels = await this.parcelRepository.find({
                where: {
                    agentId,
                    status: In([ParcelStatus.PENDING, ParcelStatus.PICKED_UP, ParcelStatus.IN_TRANSIT]),
                },
                relations: ['customer'],
                order: { createdAt: 'ASC' },
            });

            if (parcels.length === 0) {
                return {
                    status: 'success',
                    message: 'No active parcels assigned to this agent',
                    parcels: [],
                    route: null,
                };
            }

            // Extract pickup and delivery waypoints
            const waypoints: Array<{ lat: number; lng: number; parcelId: number; type: 'pickup' | 'delivery'; address: string }> = [];

            parcels.forEach(parcel => {
                // Add pickup if parcel is still pending
                if (parcel.status === ParcelStatus.PENDING && parcel.pickupLatitude && parcel.pickupLongitude) {
                    waypoints.push({
                        lat: parcel.pickupLatitude,
                        lng: parcel.pickupLongitude,
                        parcelId: parcel.id,
                        type: 'pickup',
                        address: parcel.pickupAddress,
                    });
                }

                // Add delivery for all active parcels
                if (parcel.deliveryLatitude && parcel.deliveryLongitude) {
                    waypoints.push({
                        lat: parcel.deliveryLatitude,
                        lng: parcel.deliveryLongitude,
                        parcelId: parcel.id,
                        type: 'delivery',
                        address: parcel.deliveryAddress,
                    });
                }
            });

            if (waypoints.length === 0) {
                throw new BadRequestException('No valid coordinates found for assigned parcels');
            }

            // Use current location or first waypoint as origin
            const origin = currentLocation || waypoints[0];
            const routeWaypoints = currentLocation ? waypoints : waypoints.slice(1);

            if (routeWaypoints.length === 0) {
                // Only one location, no route needed
                return {
                    status: 'success',
                    message: 'Only one location, no route optimization needed',
                    parcels,
                    waypoints,
                    route: null,
                };
            }

            const simpleWaypoints = routeWaypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
            const optimizedRoute = await this.getOptimizedRoute(origin, simpleWaypoints);

            // Map optimized order back to parcel details
            const optimizedWaypoints = optimizedRoute.summary.optimizedWaypointOrder.map((index: number) => routeWaypoints[index]);

            return {
                status: 'success',
                parcels,
                origin,
                waypoints: optimizedWaypoints,
                route: optimizedRoute.route,
                summary: optimizedRoute.summary,
            };
        } catch (error) {
            this.logger.error('Failed to get agent optimized route:', error.message);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to calculate agent route: ${error.message}`);
        }
    }

    /**
     * Calculate distance between two points
     */
    async calculateDistance(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number },
    ): Promise<{ distance: string; duration: string; distanceMeters: number; durationSeconds: number }> {
        try {
            this.validateCoordinate(origin.lat, origin.lng, 'Origin');
            this.validateCoordinate(destination.lat, destination.lng, 'Destination');

            const response = await this.client.distancematrix({
                params: {
                    origins: [`${origin.lat},${origin.lng}`],
                    destinations: [`${destination.lat},${destination.lng}`],
                    mode: TravelMode.driving,
                    key: EnvConfig.GMAP_API_KEY,
                },
            });

            const result = response.data.rows[0]?.elements[0];
            if (result && result.status === 'OK') {
                return {
                    distance: result.distance.text,
                    duration: result.duration.text,
                    distanceMeters: result.distance.value,
                    durationSeconds: result.duration.value,
                };
            }

            throw new BadRequestException('Unable to calculate distance between the given points');
        } catch (error) {
            this.logger.error('Failed to calculate distance:', error.message);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Failed to calculate distance: ${error.message}`);
        }
    }

    /**
     * Geocode an address to get coordinates
     */
    async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
        try {
            if (!address || address.trim().length === 0) {
                throw new BadRequestException('Address cannot be empty');
            }

            const response = await this.client.geocode({
                params: {
                    address: address.trim(),
                    key: EnvConfig.GMAP_API_KEY,
                },
            });

            if (response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return {
                    lat: location.lat,
                    lng: location.lng,
                };
            }

            throw new NotFoundException(`Address not found: ${address}`);
        } catch (error) {
            this.logger.error('Failed to geocode address:', error.message);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to geocode address: ${error.message}`);
        }
    }
}
