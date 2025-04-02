import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Conexão com o banco de dados estabelecida');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Conexão com o banco de dados encerrada');
  }
}
