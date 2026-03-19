import { Body, Controller, Delete, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('parking')
export class ParkingController {
  constructor(private readonly service: ParkingService) {}

  // list reservations between start and end
  @Get('reservations')
  async list(@Query('start') start: string, @Query('end') end: string) {
    const data = await this.service.listReservations(start, end);
    return { status: 0, data };
  }

  @Post('reservations')
  async create(@Body() body: CreateReservationDto) {
    const data = await this.service.createReservation(body);
    return { status: 0, data };
  }

  @Post('validate-plate')
  async validatePlate(@Body() body: { licensePlate: string }) {
    const valid = await this.service.validateLicensePlateWithSRI(body.licensePlate);
    return { status: 0, data: { valid } };
  }

  @Delete('reservations/:id')
  async remove(@Param('id') id: string) {
    const data = await this.service.deleteReservation(id);
    return { status: 0, data };
  }

  @Patch('reservations/:id')
  async update(@Param('id') id: string, @Body() body: Partial<CreateReservationDto>) {
    const data = await this.service.updateReservation(id, body as any);
    return { status: 0, data };
  }

  @Get('spots')
  async spots() {
    const data = await this.service.listSpots();
    return { status: 0, data };
  }
}
