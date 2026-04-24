import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OrgProtectorsService } from './org-protectors.service'
import { OrgProtectorsController } from './org-protectors.controller'

@Module({
  imports: [PrismaModule],
  controllers: [OrgProtectorsController],
  providers: [OrgProtectorsService],
})
export class OrgProtectorsModule {}
