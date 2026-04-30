import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { SupabaseService } from '../supabase/supabase.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

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
      const msg = error.message ?? ''
      const lower = msg.toLowerCase()

      if (lower.includes('fetch failed') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
        throw new ServiceUnavailableException(
          'Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.',
        )
      }
      if (lower.includes('already registered') || lower.includes('user already registered')) {
        throw new ConflictException('Este e-mail já está cadastrado')
      }
      throw new BadRequestException(msg || 'Erro ao criar conta')
    }

    if (!data.user) {
      throw new InternalServerErrorException('Falha ao criar usuário no provedor de autenticação')
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          id: data.user.id,
          email: dto.email,
          fullName: dto.fullName,
          phonePrimary: dto.phonePrimary ?? null,
          lgpdAcceptedAt: dto.lgpdAccepted ? new Date() : null,
        },
      })

      return {
        user,
        session: data.session,
        message: 'Cadastro realizado com sucesso. Verifique seu e-mail para ativar a conta.',
      }
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string }
      if (prismaError?.code === 'P2002') {
        throw new ConflictException('Este e-mail já está cadastrado')
      }
      throw new InternalServerErrorException('Erro ao salvar usuário. Tente novamente.')
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

}