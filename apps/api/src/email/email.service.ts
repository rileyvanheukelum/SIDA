import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  async sendInvitation(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const mode =
      this.configService.get<string>('EMAIL_MODE') ?? 'console'

    const webOrigin =
      this.configService.get<string>('WEB_ORIGIN') ??
      'http://localhost:5173'

    const setupUrl =
      `${webOrigin.replace(/\/$/, '')}/setup-account?token=${encodeURIComponent(token)}`

    // Local development: print the invitation instead of sending it.
    if (mode === 'console') {
      console.log('\n========== SIDA INVITATION ==========')
      console.log(`Recipient: ${email}`)
      console.log(`Name: ${name}`)
      console.log(`Setup URL: ${setupUrl}`)
      console.log('=====================================\n')
      return
    }

    if (mode !== 'resend') {
      throw new ServiceUnavailableException(
        `Unsupported email mode: ${mode}`,
      )
    }

    await this.sendWithResend(email, name, setupUrl)
  }

  private async sendWithResend(
    email: string,
    name: string,
    setupUrl: string,
  ): Promise<void> {
    const apiKey =
      this.configService.get<string>('RESEND_API_KEY')

    const from =
      this.configService.get<string>('EMAIL_FROM')

    if (!apiKey || !from) {
      throw new ServiceUnavailableException(
        'Email invitations are not configured. Set RESEND_API_KEY and EMAIL_FROM.',
      )
    }

    let response: Response

    try {
      response = await fetch(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [email],
            subject: 'Set up your SIDA member account',
            text: `Hi ${name},

You've been invited to join SIDA.

Set your password using this one-time link (expires in 24 hours):

${setupUrl}

If you weren't expecting this invitation, you can ignore this email.`,
          }),
        },
      )
    } catch {
      throw new ServiceUnavailableException(
        'The invitation email could not be sent. Check the email service configuration and try again.',
      )
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `The invitation email could not be sent (${response.status}). Check the email service configuration and try again.`,
      )
    }
  }
}