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
        lgpdAcceptedAt: dto.lgpdAccepted ? new Date() : undefined,
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

  // ─── LOGIN POR WHATSAPP (OTP via Z-API) ──────────────────────────────────────

  async whatsappSendOtp(whatsapp: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { whatsapp },
    })

    if (!existingUser) {
      throw new BadRequestException('Número não encontrado. Cadastre-se primeiro.')
    }

    const zapiInstanceId = this.config.get<string>('zapi.instanceId')
    const zapiToken = this.config.get<string>('zapi.token')

    if (!zapiInstanceId || !zapiToken) {
      throw new BadRequestException('Login por WhatsApp ainda não configurado')
    }

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

    // Z-API espera número sem o prefixo +
    const zapiPhone = whatsapp.replace('+', '')
    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: zapiPhone,
        message: `Seu código de acesso ao Cadê Meu Dono é: ${code}. Ele expira em 5 minutos.`,
      }),
    })

    if (!response.ok) {
      throw new BadRequestException('Falha ao enviar mensagem via WhatsApp. Tente novamente.')
    }

    return {
      message: 'Código enviado via WhatsApp.',
      whatsapp,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
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

    const user = await this.prisma.user.findFirst({
      where: { whatsapp: dto.whatsapp },
    })

    if (!user) {
      throw new BadRequestException('Número não encontrado. Cadastre-se primeiro.')
    }

    const { data: linkData, error: linkError } = await this.supabase.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (linkError) {
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
