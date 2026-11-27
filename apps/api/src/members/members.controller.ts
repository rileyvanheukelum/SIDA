import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateMemberInvitationDto } from './dto/create-member-invitation.dto'
import { MembersService } from './members.service'

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('LEADERSHIP')
  @Get('management')
  findAllForManagement() {
    return this.membersService.findAllForManagement()
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('LEADERSHIP')
  @Post()
  invite(@Body() dto: CreateMemberInvitationDto) {
    return this.membersService.invite(dto)
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('LEADERSHIP')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() req: { user: { memberId: string } },
  ) {
    return this.membersService.delete(id, req.user.memberId)
  }

  @Get()
  findAll() {
    return this.membersService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(id)
  }
}