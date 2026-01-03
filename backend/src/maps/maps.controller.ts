import { Controller, Post, Get, Body, UseGuards, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/enums/user-role.enum';
import { OptimizeRouteDto, CalculateDistanceDto, GeocodeAddressDto } from './dto/maps.dto';

/**
 * Maps Controller
 * Provides route optimization endpoints for delivery agents
 */
@ApiTags('Maps')
@Controller('maps')
export class MapsController {
    constructor(private readonly mapsService: MapsService) { }

    @Post('optimize-route')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.DELIVERY_AGENT, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get optimized delivery route (Agent/Admin)' })
    @ApiBody({ type: OptimizeRouteDto })
    @ApiResponse({ status: 200, description: 'Optimized route calculated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid coordinates or waypoints' })
    async optimizeRoute(@Body() data: OptimizeRouteDto) {
        return this.mapsService.getOptimizedRoute(
            data.origin,
            data.waypoints,
            data.destination,
        );
    }

    @Get('agent-route/:agentId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.DELIVERY_AGENT, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get optimized route for agent\'s assigned parcels (Agent/Admin)' })
    @ApiQuery({ name: 'lat', required: false, description: 'Current latitude' })
    @ApiQuery({ name: 'lng', required: false, description: 'Current longitude' })
    @ApiResponse({ status: 200, description: 'Agent route calculated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid agent ID or coordinates' })
    async getAgentRoute(
        @Param('agentId', ParseIntPipe) agentId: number,
        @Query('lat') lat?: number,
        @Query('lng') lng?: number,
    ) {
        const currentLocation = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : undefined;
        return this.mapsService.getAgentOptimizedRoute(agentId, currentLocation);
    }

    @Post('distance')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Calculate distance between two points' })
    @ApiBody({ type: CalculateDistanceDto })
    @ApiResponse({ status: 200, description: 'Distance calculated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid coordinates' })
    async calculateDistance(@Body() data: CalculateDistanceDto) {
        return this.mapsService.calculateDistance(data.origin, data.destination);
    }

    @Post('geocode')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Geocode address to coordinates' })
    @ApiBody({ type: GeocodeAddressDto })
    @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid address' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async geocodeAddress(@Body() data: GeocodeAddressDto) {
        return this.mapsService.geocodeAddress(data.address);
    }
}
