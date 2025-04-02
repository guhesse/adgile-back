import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Configurar CORS
  app.enableCors();

  // Prefixo global para APIs
  app.setGlobalPrefix('api');

  // Configuração do Swagger para documentação da API
  const config = new DocumentBuilder()
    .setTitle('Adgile API')
    .setDescription('API para gerenciamento de layouts e criações visuais')
    .setVersion('1.0')
    .addTag('layouts')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Iniciar servidor
  await app.listen(3333);
  console.log(`Aplicação rodando em: ${await app.getUrl()}`);
}

bootstrap();
