import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Parcel } from '../../parcel/entities/parcel.entity';

/**
 * Location Entity
 * Records GPS location history of parcels during transit
 */
@Entity('locations')
export class Location {
    @PrimaryGeneratedColumn()
    id: number;

    // Parcel being tracked
    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcelId' })
    parcel: Parcel;

    @Column()
    parcelId: number;

    // GPS Coordinates
    @Column({ type: 'decimal', precision: 10, scale: 7 })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7 })
    longitude: number;

    // Optional address/notes
    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // Timestamp when location was recorded
    @CreateDateColumn()
    timestamp: Date;
}
