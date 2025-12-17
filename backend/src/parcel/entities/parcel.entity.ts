import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ParcelStatus } from '../enums/parcel-status.enum';
import { ParcelType } from '../enums/parcel-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { ParcelSize } from '../enums/parcel-size.enum';

@Entity('parcels')
export class Parcel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 20 })
    trackingNumber: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'customerId' })
    customer: User;

    @Column()
    customerId: number;

    @ManyToOne(() => User, { eager: true, nullable: true })
    @JoinColumn({ name: 'agentId' })
    agent: User;

    @Column({ nullable: true })
    agentId: number;

    @Column({ type: 'text' })
    pickupAddress: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    pickupLatitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    pickupLongitude: number;

    @Column({ type: 'text' })
    deliveryAddress: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    deliveryLatitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    deliveryLongitude: number;

    @Column({
        type: 'enum',
        enum: ParcelSize,
        default: ParcelSize.MEDIUM,
    })
    parcelSize: ParcelSize;

    @Column({
        type: 'enum',
        enum: ParcelType,
        default: ParcelType.PACKAGE,
    })
    parcelType: ParcelType;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    weight: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.PREPAID,
    })
    paymentMethod: PaymentMethod;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    codAmount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deliveryCharge: number;

    @Column({
        type: 'enum',
        enum: ParcelStatus,
        default: ParcelStatus.PENDING,
    })
    status: ParcelStatus;

    @Column({ type: 'text', nullable: true })
    qrCode: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLatitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLongitude: number;

    @Column({ type: 'timestamp', nullable: true })
    pickedUpAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deliveredAt: Date;

    @Column({ type: 'text', nullable: true })
    failureReason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
