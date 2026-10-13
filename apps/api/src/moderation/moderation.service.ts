import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue() {
    return this.prisma.work.findMany({
      where: {
        status: 'PENDING',
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        mediaUrl: true,
        thumbnailUrl: true,
        createdAt: true,
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        commissionRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  async reviewWork(
    workId: string,
    decision: 'APPROVED' | 'DENIED',
    completeCommission = false,
  ) {
    const work = await this.prisma.work.findUnique({
      where: { id: workId },
      select: {
        id: true,
        status: true,
        commissionRequest: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!work) {
      throw new NotFoundException('Work submission not found.')
    }

    if (work.status !== 'PENDING') {
      throw new BadRequestException(
        'This submission has already been reviewed.',
      )
    }

    if (completeCommission) {
      if (decision !== 'APPROVED') {
        throw new BadRequestException(
          'A commission can only be completed when approving work.',
        )
      }

      if (!work.commissionRequest) {
        throw new BadRequestException(
          'This work submission is not linked to a commission.',
        )
      }

      if (work.commissionRequest.status !== 'IN_PROGRESS') {
        throw new BadRequestException(
          'This commission is not currently in progress.',
        )
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.work.update({
        where: {
          id: workId,
        },
        data: {
          status: decision,
          reviewedAt: new Date(),
        },
      })

      if (completeCommission && work.commissionRequest) {
        const commissionResult = await tx.commissionRequest.updateMany({
          where: {
            id: work.commissionRequest.id,
            status: 'IN_PROGRESS',
          },
          data: {
            status: 'COMPLETED',
          },
        })

        if (commissionResult.count === 0) {
          throw new BadRequestException(
            'The commission is no longer in progress. Refresh and try again.',
          )
        }
      }
    })

    return this.prisma.work.findUnique({
      where: { id: workId },
      select: {
        id: true,
        title: true,
        status: true,
        reviewedAt: true,
        commissionRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })
  }
}