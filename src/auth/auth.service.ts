import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.password === senha) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { userId: user.user_id, email: user.email };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async register(userData: { nome: string; email: string; senha: string }) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        return { success: false, message: 'Usuário já existe.' };
      }

      await this.prisma.user.create({
        data: {
          name: userData.nome,
          email: userData.email,
          password: userData.senha,
          tenant_id: 1, // Valor padrão para tenant_id
        },
      });

      return { success: true, message: 'Usuário registrado com sucesso.' };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return { success: false, message: 'Erro interno do servidor.' };
    }
  }

  async checkAuth(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { user_id: decoded.userId },
      });
      return { isAuthenticated: !!user };
    } catch {
      return { isAuthenticated: false };
    }
  }
}
