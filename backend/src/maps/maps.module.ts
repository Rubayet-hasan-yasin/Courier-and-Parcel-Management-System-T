import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { Parcel } from '../parcel/entities/parcel.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Parcel])],
    providers: [MapsService],
    controllers: [MapsController],
    exports: [MapsService],
})
export class MapsModule { }
