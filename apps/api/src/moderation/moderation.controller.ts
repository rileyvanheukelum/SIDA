import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { ModerationService } from './moderation.service'

type ReviewWorkBody = {
  reviewNotes?: string | null
  completeCommission?: boolean
}

@Controller('moderation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('LEADERSHIP')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
  ) {}

  @Get('queue')
  getQueue() {
    return this.moderationService.getQueue()
  }

  @Get('history')
  getHistory() {
    return this.moderationService.getHistory()
  }

  @Patch(':workId/approve')
  approve(
    @Param('workId') workId: string,
    @Body() body: ReviewWorkBody,
  ) {
    return this.moderationService.reviewWork(
      workId,
      'APPROVED',
      body?.completeCommission ?? false,
      body?.reviewNotes,
    )
  }

  @Patch(':workId/deny')
  deny(
    @Param('workId') workId: string,
    @Body() body: ReviewWorkBody,
  ) {
    return this.moderationService.reviewWork(
      workId,
      'DENIED',
      false,
      body?.reviewNotes,
    )
  }
}