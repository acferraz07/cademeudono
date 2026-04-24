import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from '@prisma/client'
import { AuthenticatedRequest } from '../types/authenticated-request.interface'

/** Extrai o usuário autenticado da requisição (preenchido pelo SupabaseAuthGuard) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.user
  },
)
