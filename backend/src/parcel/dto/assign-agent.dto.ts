import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO for assigning a delivery agent to a parcel
 * Admin-only operation
 */
export class AssignAgentDto {
    @ApiProperty({
        description: 'ID of the delivery agent to assign',
        example: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    agentId: number;
}
