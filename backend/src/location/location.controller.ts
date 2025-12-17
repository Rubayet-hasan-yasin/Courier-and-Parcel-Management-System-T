import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { AddLocationDto } from './dto/add-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/enums/user-role.enum';

/**
 * Location Controller
 * Handles location tracking endpoints
 */
@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Post(':parcelId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add location update for parcel (Agent/Admin)' })
  @ApiResponse({ status: 201, description: 'Location added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  addLocation(
    @Param('parcelId', ParseIntPipe) parcelId: number,
    @Body() addLocationDto: AddLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.locationService.addLocation(
      parcelId,
      addLocationDto,
      user.userId,
      user.role,
    );
  }

  @Get(':parcelId/history')
  @ApiOperation({ summary: 'Get location history for parcel (Public)' })
  @ApiResponse({ status: 200, description: 'Location history' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  getHistory(@Param('parcelId', ParseIntPipe) parcelId: number) {
    return this.locationService.getHistory(parcelId);
  }

  @Get(':parcelId/latest')
  @ApiOperation({ summary: 'Get latest location for parcel (Public)' })
  @ApiResponse({ status: 200, description: 'Latest location' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  getLatest(@Param('parcelId', ParseIntPipe) parcelId: number) {
    return this.locationService.getLatest(parcelId);
  }
}
