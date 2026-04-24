import { Module } from '@nestjs/common'
import { FosterVolunteersController } from './foster-volunteers.controller'
import { FosterVolunteersService } from './foster-volunteers.service'

@Module({
  controllers: [FosterVolunteersController],
  providers: [FosterVolunteersService],
})
export class FosterVolunteersModule {}
