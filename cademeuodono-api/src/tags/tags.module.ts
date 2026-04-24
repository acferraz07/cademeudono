import { Module } from '@nestjs/common'
import { PetPublicController, TagsController } from './tags.controller'
import { TagsService } from './tags.service'

@Module({
  controllers: [PetPublicController, TagsController],
  providers: [TagsService],
})
export class TagsModule {}
