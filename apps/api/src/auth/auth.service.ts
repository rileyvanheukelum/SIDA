import { 
    Injectable,
    UnauthorizedException,
    NotFoundException 
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'
import { createHash } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AcceptInvitationDto } from './dto/accept-invitation.dto'

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async login(loginDto: LoginDto) {
        const email = loginDto.email.trim().toLowerCase()

        const member = await this.prisma.member.findUnique({
            where: { email },
        })

        if (!member) {
            throw new UnauthorizedException('Invalid email or password')
        }

        const passwordMatches = await compare(
            loginDto.password,
            member.passwordHash,
        )

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password')
        }

        const payload = {
            sub: member.id,
            email: member.email,
            role: member.role,
        }

        const accessToken = await this.jwtService.signAsync(payload)

        return {
        accessToken,
        member: {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            title: member.title,
            bio: member.bio,
            disciplines: member.disciplines,
            profileImage: member.profileImage,
        },
        }
    }

    async getCurrentMember(memberId: string) {
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
            select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true,
            bio: true,
            disciplines: true,
            profileImage: true,
            },
        })

        if (!member) {
            throw new UnauthorizedException('Member account no longer exists.')
        }

        return member
    }

    async updateProfile(memberId: string, updateProfileDto: UpdateProfileDto) {
        const member = await this.prisma.member.update({
            where: { id: memberId },
            data: updateProfileDto,
            select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true,
            bio: true,
            disciplines: true,
            profileImage: true,
            },
        })

        return member
    }

    async acceptInvitation(dto: AcceptInvitationDto) {
        const tokenHash = createHash('sha256').update(dto.token).digest('hex')
        const now = new Date()
        const member = await this.prisma.member.findFirst({
            where: {
                invitationTokenHash: tokenHash,
                invitationExpiresAt: { gt: now },
            },
            select: { id: true },
        })

        if (!member) {
            throw new UnauthorizedException(
                'This invitation link is invalid or has expired.',
            )
        }

        const passwordHash = await hash(dto.password, 12)
        const result = await this.prisma.member.updateMany({
            where: {
                id: member.id,
                invitationTokenHash: tokenHash,
                invitationExpiresAt: { gt: now },
            },
            data: {
                passwordHash,
                invitationTokenHash: null,
                invitationExpiresAt: null,
            },
        })

        if (result.count !== 1) {
            throw new UnauthorizedException(
                'This invitation link is invalid or has expired.',
            )
        }

        return { success: true }
    }
}