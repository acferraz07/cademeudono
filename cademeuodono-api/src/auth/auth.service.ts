import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { PhoneSendOtpDto } from './dto/phone-send-otp.dto'
import { PhoneVerifyOtpDto } from './dto/phone-verify-otp.dto'
import { WhatsappVerifyOtpDto } from './dto/whatsapp-verify-otp.dto'

const OTP_EXPIRY_MINUTES = 5
const OTP_MAX_ATTEMPTS = 3

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: { full_name: dto.fullName },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new ConflictException('Este e-mail já está cadastrado')
      }
      throw new BadRequestException(error.message)
    }

    if (!data.user) {
      throw new InternalServerErrorException('Falha ao criar usuário no provedor de autenticação')
    }

    const user = await this.prisma.user.create({
      data: {
        id: data.user.id,
        email: dto.email,
        fullName: dto.fullName,
        phonePrimary: dto.phonePrimary,
      },
    })

    return {
      user,
      session: data.session,
      message: 'Cadastro realizado com sucesso. Verifique seu e-mail para ativar a conta.',
    }
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.signInWithPassword({
      email: dto.email,
      password: dto.password,
    })

    if (error || !data.user) {
      throw new UnauthorizedException('E-mail ou senha inválidos')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.user.id },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Conta não encontrada ou desativada')
    }

    return {
      user,
      session: data.session,
    }
  }

  async logout(token: string) {
    const { error } = await this.supabase.admin.signOut(token)

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { message: 'Logout realizado com sucesso' }
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    return { session: data.session }
  }

  async forgotPassword(email: string) {
    const appUrl = this.config.get<string>('appUrl')

    const { error } = await this.supabase.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`,
    })

    if (error) {
      throw new BadRequestException(error.message)
    }

    return {
      message: 'Se este e-mail estiver cadastrado, você receberá as instruções de recuperação.',
    }
  }

  // ─── LOGIN POR TELEFONE (Supabase Phone Auth) ────────────────────────────────

  async phoneSendOtp(dto: PhoneSendOtpDto) {
    const { error } = await this.supabase.signInWithOtp({ phone: dto.phone })

    if (error) {
      if (error.message.toLowerCase().includes('sms') || error.message.toLowerCase().includes('phone')) {
        throw new BadRequestException(
          'Envio de SMS não configurado. Configure um provedor SMS no Supabase (Twilio, MessageBird, etc.)',
        )
      }
      throw new BadRequestException(error.message)
    }

    return {
      message: 'Código enviado por SMS para o número informado.',
      phone: dto.phone,
    }
  }

  async phoneVerifyOtp(dto: PhoneVerifyOtpDto) {
    const { data, error } = await this.supabase.verifyOtp({
      phone: dto.phone,
      token: dto.code,
      type: 'sms',
    })

    if (error || !data.user) {
      throw new UnauthorizedException('Código inválido ou expirado')
    }

    // Sincronizar usuário com nosso banco se ainda não existe
    const user = await this.prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email: data.user.email ?? `phone_${data.user.id}@cademeuodono.app`,
        fullName: data.user.user_metadata?.['full_name'] ?? 'Usuário',
        phonePrimary: dto.phone,
      },
      update: {
        phonePrimary: dto.phone,
      },
    })

    return {
      user,
      session: data.session,
    }
  }

  // ─── LOGIN POR WHATSAPP (OTP customizado) ────────────────────────────────────

  async whatsappSendOtp(whatsapp: string) {
    // Invalidar OTPs anteriores para este número
    await this.prisma.otpVerification.updateMany({
      where: { phone: whatsapp, verified: false },
      data: { verified: true },
    })

    const code = this.generateNumericCode(6)
    const codeHash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await this.prisma.otpVerification.create({
      data: { phone: whatsapp, codeHash, expiresAt },
    })

    // TODO: integrar com provedor WhatsApp (Twilio, Z-API, WATI, Evolution API)
    // Exemplo: await this.whatsappProvider.send(whatsapp, `Seu código Cadê Meu Dono: ${code}`)

    const isDev = this.config.get<string>('NODE_ENV') !== 'production'

    return {
      message: 'Código enviado via WhatsApp.',
      whatsapp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      // Retornar código apenas em desenvolvimento
      ...(isDev && { _devCode: code }),
    }
  }

  async whatsappVerifyOtp(dto: WhatsappVerifyOtpDto) {
    const now = new Date()

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        phone: dto.whatsapp,
        verified: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      throw new UnauthorizedException('Código não encontrado ou expirado. Solicite um novo.')
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException('Muitas tentativas. Solicite um novo código.', HttpStatus.TOO_MANY_REQUESTS)
    }

    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    })

    const isValid = await bcrypt.compare(dto.code, otpRecord.codeHash)
    if (!isValid) {
      throw new UnauthorizedException('Código inválido')
    }

    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    // Buscar ou criar usuário pelo WhatsApp
    let user = await this.prisma.user.findFirst({
      where: { whatsapp: dto.whatsapp },
    })

    if (!user) {
      // Criar usuário no Supabase e no nosso banco
      const { data, error } = await this.supabase.admin.createUser({
        phone: dto.whatsapp,
        phone_confirm: true,
        user_metadata: { whatsapp: dto.whatsapp },
      })

      if (error || !data.user) {
        throw new InternalServerErrorException('Falha ao criar conta')
      }

      user = await this.prisma.user.create({
        data: {
          id: data.user.id,
          email: `whatsapp_${data.user.id.slice(0, 8)}@cademeuodono.app`,
          fullName: 'Usuário',
          whatsapp: dto.whatsapp,
          phonePrimary: dto.whatsapp,
        },
      })
    }

    // Gerar session via admin
    const { data: linkData, error: linkError } = await this.supabase.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (linkError) {
      // Fallback: retornar o usuário sem session (frontend pode lidar)
      return { user, session: null, message: 'Autenticado. Configure a sessão manualmente.' }
    }

    return { user, session: linkData.properties }
  }

  private generateNumericCode(length: number): string {
    let code = ''
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString()
    }
    return code
  }
}
