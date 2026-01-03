'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

interface Coordinate {
    lat: number;
    lng: number;
}

interface Waypoint extends Coordinate {
    parcelId: number;
    type: 'pickup' | 'delivery';
    address: string;
}

interface RouteSummary {
    totalDistance: string;
    totalDistanceMeters: number;
    totalDuration: string;
    totalDurationSeconds: number;
    optimizedWaypointOrder: number[];
    numberOfWaypoints: number;
}

interface OptimizedRouteData {
    status: string;
    parcels: any[];
    origin?: Coordinate;
    waypoints?: Waypoint[];
    route: any;
    summary?: RouteSummary;
    message?: string;
}

/**
 * Hook to fetch optimized route for a delivery agent
 * @param agentId - ID of the delivery agent
 * @param currentLocation - Optional current location of the agent
 * @param enabled - Whether to fetch the route (default: true)
 */
export function useOptimizedRoute(
    agentId?: number,
    currentLocation?: Coordinate,
    enabled: boolean = true,
) {
    const query = useQuery<OptimizedRouteData>({
        queryKey: ['optimized-route', agentId, currentLocation],
        queryFn: async () => {
            if (!agentId) {
                throw new Error('Agent ID is required');
            }

            const params = new URLSearchParams();
            if (currentLocation) {
                params.append('lat', currentLocation.lat.toString());
                params.append('lng', currentLocation.lng.toString());
            }

            const queryString = params.toString();
            const url = `/maps/agent-route/${agentId}${queryString ? `?${queryString}` : ''}`;

            const response = await api.get(url);
            return response.data;
        },
        enabled: enabled && !!agentId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    return {
        ...query,
        route: query.data,
        hasRoute: query.data?.route != null,
        hasParcels: (query.data?.parcels?.length ?? 0) > 0,
    };
}

/**
 * Hook to fetch general optimized route
 * @param origin - Starting point
 * @param waypoints - Array of waypoints
 * @param destination - Optional destination
 */
export function useCustomOptimizedRoute(
    origin?: Coordinate,
    waypoints?: Coordinate[],
    destination?: Coordinate,
    enabled: boolean = true,
) {
    const query = useQuery({
        queryKey: ['custom-optimized-route', origin, waypoints, destination],
        queryFn: async () => {
            if (!origin || !waypoints || waypoints.length === 0) {
                throw new Error('Origin and at least one waypoint are required');
            }

            const response = await api.post('/maps/optimize-route', {
                origin,
                waypoints,
                destination,
            });
            return response.data;
        },
        enabled: enabled && !!origin && !!waypoints && waypoints.length > 0,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    return query;
}
