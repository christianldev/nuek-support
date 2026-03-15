export class CreateReservationDto {
  id!: string;
  userId?: string;
  spotId!: string;
  start!: string; // ISO string
  end!: string; // ISO string
  status?: string;
}
