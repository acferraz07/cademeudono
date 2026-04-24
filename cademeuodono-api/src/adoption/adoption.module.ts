import { Module } from '@nestjs/common'
import { AdoptionController } from './adoption.controller'
import { AdoptionService } from './adoption.service'
import { SupabaseModule } from '../supabase/supabase.module'

@Module({
  imports: [SupabaseModule],
  controllers: [AdoptionController],
  providers: [AdoptionService],
})
export class AdoptionModule {}
