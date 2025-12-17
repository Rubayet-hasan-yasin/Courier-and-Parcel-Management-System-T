import { PartialType } from '@nestjs/swagger';
import { CreateParcelDto } from './create-parcel.dto';

/**
 * DTO for updating parcel information
 * Allows partial updates to parcel details (Admin only)
 */
export class UpdateParcelDto extends PartialType(CreateParcelDto) { }
