import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const reflector = app.get(Reflector)

  // app.useGlobalGuards(
  //   new JwtAuthGuard(), 
  //   new RolesGuard(reflector),
  // )

  const config = new DocumentBuilder()
    .setTitle('Priv-chat API')
    .setDescription('API documentation for Priv chat E2EE App')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
