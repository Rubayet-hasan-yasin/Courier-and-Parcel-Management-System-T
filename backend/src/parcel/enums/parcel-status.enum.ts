/**
 * Parcel Status Enum
 * Tracks the lifecycle of a parcel from booking to delivery
 */
export enum ParcelStatus {
    PENDING = 'pending',
    PICKED_UP = 'picked_up',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    FAILED = 'failed',
}
