import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.enableCors();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        // Extrai mensagens detalhadas de todos os campos
        const messages = errors.map(err => {
          if (err.constraints) {
            return Object.values(err.constraints).join(' ');
          }
          return 'Erro de validação.';
        });
        return new BadRequestException(messages);
      },
    }),
  );

  // Servir arquivos estáticos (avatars, etc.)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();