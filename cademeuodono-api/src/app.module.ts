import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import configuration from './config/configuration'
import { PrismaModule } from './prisma/prisma.module'
import { SupabaseModule } from './supabase/supabase.module'
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { PetsModule } from './pets/pets.module'
import { AnnouncementsModule } from './announcements/announcements.module'
import { TagsModule } from './tags/tags.module'
import { FosterVolunteersModule } from './foster-volunteers/foster-volunteers.module'
import { BreedsModule } from './breeds/breeds.module'
import { DevicesModule } from './devices/devices.module'
import { AdoptionModule } from './adoption/adoption.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    PetsModule,
    AnnouncementsModule,
    TagsModule,
    FosterVolunteersModule,
    BreedsModule,
    DevicesModule,
    AdoptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
