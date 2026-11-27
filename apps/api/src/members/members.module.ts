import { Module } from '@nestjs/common'

import { MembersController } from './members.controller'
import { MembersService } from './members.service'
import { PrismaModule } from '../prisma/prisma.module'
import { RolesGuard } from '../auth/roles.guard'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [
    PrismaModule,
    EmailModule,
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    RolesGuard,
  ],
})
export class MembersModule {}