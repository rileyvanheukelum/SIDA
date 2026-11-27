import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { EmailService } from '../email/email.service'
import { Prisma, Role } from '@prisma/client'
import { createHash, randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'

import { PrismaService } from '../prisma/prisma.service'
import { CreateMemberInvitationDto } from './dto/create-member-invitation.dto'

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findAll() {
    return this.prisma.member.findMany({
      where: { invitationTokenHash: null },
      select: {
        id: true,
        name: true,
        title: true,
        bio: true,
        disciplines: true,
        profileImage: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, invitationTokenHash: null },
      select: {
        id: true,
        name: true,
        title: true,
        bio: true,
        disciplines: true,
        profileImage: true,
        role: true,
      },
    })

    if (!member) {
      throw new NotFoundException('Member not found')
    }

    return member
  }

  async findAllForManagement() {
    const members = await this.prisma.member.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        invitationExpiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return members
  }

  async invite(dto: CreateMemberInvitationDto) {
    const name = dto.name.trim()
    if (!name) {
      throw new BadRequestException('A member name is required.')
    }

    const email = dto.email.trim().toLowerCase()
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const invitationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const unusablePasswordHash = await hash(randomBytes(32).toString('hex'), 12)

    let member
    try {
      member = await this.prisma.member.create({
        data: {
          name,
          email,
          role: dto.role ?? Role.MEMBER,
          disciplines: dto.disciplines?.map((discipline) => discipline.trim()).filter(Boolean) ?? [],
          passwordHash: unusablePasswordHash,
          invitationTokenHash: tokenHash,
          invitationExpiresAt,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          invitationExpiresAt: true,
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account already exists for this email.')
      }

      throw error
    }

    try {
      await this.emailService.sendInvitation(
        email,
        name,
        token,
      )
    } catch (error) {
      await this.prisma.member.delete({
        where: { id: member.id },
      })
      throw error
    }

    return member
  }

  async delete(id: string, requestingMemberId: string) {
    return this.prisma.$transaction(
      async (transaction) => {
        const member = await transaction.member.findUnique({
          where: { id },
          select: { id: true, role: true },
        })

        if (!member) {
          throw new NotFoundException('Member not found.')
        }

        if (member.id === requestingMemberId) {
          throw new ForbiddenException('You cannot delete your own account.')
        }

        if (member.role === Role.LEADERSHIP) {
          const leadershipCount = await transaction.member.count({
            where: { role: Role.LEADERSHIP },
          })

          if (leadershipCount <= 1) {
            throw new ConflictException(
              'The last Leadership account cannot be deleted.',
            )
          }
        }

        await transaction.member.delete({ where: { id } })
        return { id }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }
}