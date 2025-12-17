import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ParcelService } from './parcel.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/enums/user-role.enum';
import { ParcelStatus } from './enums/parcel-status.enum';

@ApiTags('Parcels')
@Controller('parcels')
export class ParcelController {
  constructor(private readonly parcelService: ParcelService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Book a new parcel (Customer)' })
  @ApiResponse({ status: 201, description: 'Parcel booked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(
    @Body() createParcelDto: CreateParcelDto,
    @CurrentUser() user: any,
  ) {
    return this.parcelService.create(createParcelDto, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all parcels (Admin sees all, Agent/Customer sees own)',
  })
  @ApiQuery({
    name: 'status',
    enum: ParcelStatus,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'List of parcels' })
  findAll(
    @Query('status') status: ParcelStatus,
    @CurrentUser() user: any,
  ) {
    if (user.role === UserRole.ADMIN) {
      return this.parcelService.findAll({ status });
    }

    if (user.role === UserRole.DELIVERY_AGENT) {
      return this.parcelService.getAssignedParcels(user.userId);
    }

    return this.parcelService.getBookingHistory(user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get parcel statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Parcel statistics' })
  getStats() {
    return this.parcelService.getStats();
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my booking history (Customer)' })
  @ApiResponse({ status: 200, description: 'Customer booking history' })
  getMyBookings(@CurrentUser() user: any) {
    return this.parcelService.getBookingHistory(user.userId);
  }

  @Get('assigned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get assigned parcels (Delivery Agent)' })
  @ApiResponse({ status: 200, description: 'Assigned parcels' })
  getAssignedParcels(@CurrentUser() user: any) {
    return this.parcelService.getAssignedParcels(user.userId);
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track parcel by tracking number (Public)' })
  @ApiResponse({ status: 200, description: 'Parcel details' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  trackParcel(@Param('trackingNumber') trackingNumber: string) {
    return this.parcelService.findByTrackingNumber(trackingNumber);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get parcel by ID' })
  @ApiResponse({ status: 200, description: 'Parcel details' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parcelService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update parcel details (Admin only)' })
  @ApiResponse({ status: 200, description: 'Parcel updated' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParcelDto: UpdateParcelDto,
  ) {
    return this.parcelService.update(id, updateParcelDto);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign delivery agent to parcel (Admin only)' })
  @ApiResponse({ status: 200, description: 'Agent assigned successfully' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  assignAgent(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignAgentDto: AssignAgentDto,
  ) {
    return this.parcelService.assignAgent(id, assignAgentDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update parcel status (Agent/Admin)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.parcelService.updateStatus(
      id,
      updateStatusDto,
      user.userId,
      user.role,
    );
  }

  @Patch(':id/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DELIVERY_AGENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update parcel location (Delivery Agent)' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() location: { latitude: number; longitude: number },
    @CurrentUser() user: any,
  ) {
    return this.parcelService.updateLocation(
      id,
      location.latitude,
      location.longitude,
      user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete parcel (Admin only)' })
  @ApiResponse({ status: 200, description: 'Parcel deleted' })
  @ApiResponse({ status: 404, description: 'Parcel not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.parcelService.remove(id);
  }
}
