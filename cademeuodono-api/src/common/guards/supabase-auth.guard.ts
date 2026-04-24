import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { SupabaseService } from '../../supabase/supabase.service'
import { PrismaService } from '../../prisma/prisma.service'
import { AuthenticatedRequest } from '../types/authenticated-request.interface'

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractToken(request)

    if (!token) {
      throw new UnauthorizedException('Token de acesso não fornecido')
    }

    const {
      data: { user: supabaseUser },
      error,
    } = await this.supabase.getUser(token)

    if (error || !supabaseUser) {
      throw new UnauthorizedException('Token inválido ou expirado')
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: supabaseUser.id },
    })

    if (!dbUser || !dbUser.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo')
    }

    const authReq = request as AuthenticatedRequest
    authReq.user = dbUser
    authReq.token = token

    return true
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
