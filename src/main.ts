import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aumentar o limite de tamanho do payload
  app.use(express.json({ limit: '50mb' }));

  // Configuração CORS simplificada
  app.enableCors({
    origin: true, // Aceita requisições de qualquer origem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: false // Desativando credentials para evitar problemas com preflight
  });

  const config = new DocumentBuilder()
    .setTitle('Adgile API')
    .setDescription('API para refinamento de layouts usando Perplexity')
    .setVersion('1.0')
    .addTag('refinement')
    .addTag('hello')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();