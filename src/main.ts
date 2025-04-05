import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Configurar CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefixo global para APIs
  app.setGlobalPrefix('api');

  // Configuração do Swagger para documentação da API
  const config = new DocumentBuilder()
    .setTitle('Adgile API')
    .setDescription('API para gerenciamento de layouts e criações visuais')
    .setVersion('1.0')
    .addTag('auth')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Adiciona suporte a cookies
  app.use(cookieParser());

  // Iniciar servidor
  await app.listen(3333);
  console.log(`Aplicação rodando em: ${await app.getUrl()}`);
}

bootstrap();
