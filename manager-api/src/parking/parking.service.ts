import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Connection } from 'oracledb';
import oracledb from 'oracledb';
import { OracleFactory } from '../database/oracle.factory';
import type { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ParkingService {
  private reservationsTableMissingWarned = false;

  constructor(private readonly oracleFactory: OracleFactory) {}

  // Helper to safely extract a numeric count from an Oracle execute result
  private extractCount(result: any): number {
    const rows = result?.rows;
    if (!rows || !rows[0]) return 0;
    const first = rows[0];
    if (Array.isArray(first)) return Number(first[0] ?? 0);
    if (typeof first === 'object') return Number(first.CNT ?? Object.values(first)[0] ?? 0);
    return 0;
  }

  async listReservations(start: string, end: string) {
    let conn: Connection | null = null;
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid start/end date range');
      }

      conn = await this.oracleFactory.getConnection('support');
      const result = await conn.execute(
        `SELECT id, user_id, spot_id, start_time, end_time, status, created_at
         FROM parking_reservations
         WHERE start_time < :endTime AND end_time > :startTime`,
        { startTime: startDate, endTime: endDate },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );

      const rows = (result.rows as any[]) || [];
      return rows.map((r) => ({
        id: r.ID,
        userId: r.USER_ID,
        spotId: r.SPOT_ID,
        start: r.START_TIME instanceof Date ? r.START_TIME.toISOString() : r.START_TIME,
        end: r.END_TIME instanceof Date ? r.END_TIME.toISOString() : r.END_TIME, 
        status: r.STATUS,
        createdAt: r.CREATED_AT instanceof Date ? r.CREATED_AT.toISOString() : r.CREATED_AT,
      }));
    } catch (err: any) {
      const msg = err?.message || String(err);
      // Allow UI to load even before DB objects are created.
      if (msg.includes('ORA-00942')) {
        if (!this.reservationsTableMissingWarned) {
          console.warn('parking_reservations table is missing in current Oracle DB connection; returning empty list');
          this.reservationsTableMissingWarned = true;
        }
        return [];
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      console.error('Failed to list reservations', err);
      throw new InternalServerErrorException('Failed to list reservations');
    } finally {
      try { await conn?.close(); } catch {};
    }
  }

  async createReservation(dto: CreateReservationDto) {
    let conn: Connection | null = null;
    try {
      conn = await this.oracleFactory.getConnection('support');
      // check overlap for same spot
      const overlap = await conn.execute(
        `SELECT COUNT(1) CNT FROM parking_reservations
         WHERE spot_id = :spotId
           AND NOT (end_time <= :startTime OR start_time >= :endTime)`,
        { spotId: dto.spotId, startTime: new Date(dto.start), endTime: new Date(dto.end) },
      );
      const cnt = this.extractCount(overlap);
      if (cnt > 0) {
        throw new ConflictException('Parking spot already reserved for this time range');
      }

      await conn.execute(
        `INSERT INTO parking_reservations (id, user_id, spot_id, start_time, end_time, status, created_at)
         VALUES (:id, :userId, :spotId, :startTime, :endTime, :status, SYSTIMESTAMP)`,
        {
          id: dto.id,
          userId: dto.userId ?? null,
          spotId: dto.spotId,
          startTime: new Date(dto.start),
          endTime: new Date(dto.end),
          status: dto.status ?? 'active',
        },
        { autoCommit: true },
      );

      return { ...dto };
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      throw new InternalServerErrorException('Failed to create reservation');
    } finally {
      try { await conn?.close(); } catch {};
    }
  }

  async deleteReservation(id: string) {
    let conn: Connection | null = null;
    try {
      conn = await this.oracleFactory.getConnection('support');
      const r = await conn.execute(`DELETE FROM parking_reservations WHERE id = :id`, { id }, { autoCommit: true });
      // rowCount may be available as r.rowsAffected
      if ((r as any).rowsAffected === 0) {
        throw new NotFoundException('Reservation not found');
      }
      return { id };
    } catch (err) {
      throw err;
    } finally {
      try { await conn?.close(); } catch {};
    }
  }

  async updateReservation(id: string, dto: { spotId?: string; start?: string; end?: string }) {
    let conn: Connection | null = null;
    try {
      conn = await this.oracleFactory.getConnection('support');
      // check exist
      const exist = await conn.execute(`SELECT id, spot_id FROM parking_reservations WHERE id = :id`, { id });
      const row = exist.rows?.[0] as any;
      if (!row) throw new NotFoundException('Reservation not found');

      // row may be an array ([id, spot_id]) or an object ({ ID, SPOT_ID } or { id, spot_id })
      const existingSpotId = Array.isArray(row)
        ? row[1]
        : row.SPOT_ID ?? row.spot_id ?? row[1] ?? row[0];
      const newSpotId = dto.spotId ?? existingSpotId;
      const newStart = dto.start ? new Date(dto.start) : null;
      const newEnd = dto.end ? new Date(dto.end) : null;

      // overlap check excluding self
      const overlap = await conn.execute(
        `SELECT COUNT(1) FROM parking_reservations WHERE spot_id = :spotId AND id != :id
         AND NOT (end_time <= NVL(:start, end_time) OR start_time >= NVL(:end, start_time))`,
        { spotId: newSpotId, id, start: newStart, end: newEnd },
      );
      const cnt = this.extractCount(overlap);
      if (cnt > 0) throw new ConflictException('Parking spot already reserved for this time range');

      const binds: any = { id };
      const sets: string[] = [];
      if (dto.spotId) { sets.push('spot_id = :spotId'); binds.spotId = dto.spotId; }
      if (dto.start) { sets.push('start_time = :start'); binds.start = new Date(dto.start); }
      if (dto.end) { sets.push('end_time = :end'); binds.end = new Date(dto.end); }

      if (sets.length === 0) return { id };

      const sql = `UPDATE parking_reservations SET ${sets.join(', ')} WHERE id = :id`;
      await conn.execute(sql, binds, { autoCommit: true });
      return { id };
    } catch (err) {
      throw err;
    } finally {
      try { await conn?.close(); } catch {};
    }
  }

  async listSpots() {
    let conn: Connection | null = null;
    try {
      conn = await this.oracleFactory.getConnection('support');
      const result = await conn.execute(`SELECT id, name, location FROM parking_spots`);
      const rows = (result.rows as any[]) || [];
      return rows.map((r) => ({ id: r[0], name: r[1], location: r[2] }));
    } catch (err) {
      // if table missing, return mock
      return [];
    } finally {
      try { await conn?.close(); } catch {};
    }
  }
}
