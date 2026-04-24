import { NestFactory } from '@nestjs/core'
import { ValidationPipe, RequestMethod } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  // Prefixo global da API, excluindo a rota pública das smart tags
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'pet/:code', method: RequestMethod.GET }],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new TransformInterceptor())

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '*')
    .split(',')
    .map((o) => o.trim())

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cadê Meu Dono API')
    .setDescription('API da plataforma Cadê Meu Dono — localização, identificação e monitoramento de pets')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = config.get<number>('port', 3000)
  await app.listen(port)
  console.log(`🐾 Cadê Meu Dono API rodando em http://localhost:${port}`)
  console.log(`📚 Swagger disponível em http://localhost:${port}/api/docs`)
}

bootstrap()
