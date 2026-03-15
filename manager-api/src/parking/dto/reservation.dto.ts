export class ReservationDto {
  id!: string;
  userId?: string;
  spotId!: string;
  start!: string;
  end!: string;
  status?: string;
  createdAt?: string;
}
