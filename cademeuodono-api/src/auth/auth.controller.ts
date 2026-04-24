import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../common/decorators/public.decorator'
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { PhoneSendOtpDto } from './dto/phone-send-otp.dto'
import { PhoneVerifyOtpDto } from './dto/phone-verify-otp.dto'
import { WhatsappVerifyOtpDto } from './dto/whatsapp-verify-otp.dto'

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com e-mail e senha' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerrar sessão' })
  logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.token)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token com refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken)
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email)
  }

  // ─── LOGIN POR TELEFONE (SMS via Supabase) ───────────────────────────────────

  @Public()
  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar OTP por SMS (Supabase Phone Auth)',
    description: 'Requer Twilio ou outro provedor SMS configurado no Supabase.',
  })
  phoneSendOtp(@Body() dto: PhoneSendOtpDto) {
    return this.authService.phoneSendOtp(dto)
  }

  @Public()
  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP de SMS e autenticar' })
  @ApiResponse({ status: 200, description: 'Autenticado com sucesso' })
  @ApiResponse({ status: 401, description: 'Código inválido ou expirado' })
  phoneVerifyOtp(@Body() dto: PhoneVerifyOtpDto) {
    return this.authService.phoneVerifyOtp(dto)
  }

  // ─── LOGIN POR WHATSAPP (OTP customizado) ────────────────────────────────────

  @Public()
  @Post('whatsapp/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar OTP via WhatsApp',
    description:
      'Gera código OTP e envia via WhatsApp. Requer provedor externo (Twilio, Z-API, WATI, Evolution API) configurado.',
  })
  whatsappSendOtp(@Body() dto: PhoneSendOtpDto) {
    return this.authService.whatsappSendOtp(dto.phone)
  }

  @Public()
  @Post('whatsapp/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP do WhatsApp e autenticar' })
  @ApiResponse({ status: 200, description: 'Autenticado com sucesso' })
  @ApiResponse({ status: 401, description: 'Código inválido ou expirado' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas' })
  whatsappVerifyOtp(@Body() dto: WhatsappVerifyOtpDto) {
    return this.authService.whatsappVerifyOtp(dto)
  }
}
