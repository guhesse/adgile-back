import { Controller, Post, Body, Get, Req, HttpCode, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: 'Login de usuário' })
  @ApiBody({ 
    schema: { 
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        senha: { type: 'string', example: '123456' }
      }
    } 
  })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() body: { email: string; senha: string },
    @Res({ passthrough: true }) response: Response
  ) {
    const user = await this.authService.validateUser(body.email, body.senha);
    if (!user) {
      return { message: 'Credenciais inválidas' };
    }
    
    // Adicionando await aqui para resolver o erro
    const result = await this.authService.login(user);
    
    // Configurar cookie para armazenar o token
    response.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // em produção, só permitir em HTTPS
      maxAge: 3600000, // 1 hora em milissegundos
      path: '/',
    });
    
    return result;
  }

  @ApiOperation({ summary: 'Registro de novo usuário' })
  @ApiBody({ 
    schema: { 
      type: 'object',
      properties: {
        nome: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'user@example.com' },
        senha: { type: 'string', example: '123456' }
      }
    } 
  })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro ao registrar usuário.' })
  @HttpCode(201)
  @Post('register')
  async register(@Body() body: { nome: string; email: string; senha: string }) {
    return this.authService.register(body);
  }

  @ApiOperation({ summary: 'Verificar autenticação do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @Get('check')
  async checkAuth(@Req() req: any) {
    try {
      // Verificar cookie primeiro (prioridade)
      const cookieToken = req.cookies?.auth_token;
      
      // Verificar header de autorização como fallback
      const authHeader = req.headers.authorization;
      const headerToken = authHeader ? authHeader.split(' ')[1] : null;
      
      // Usar o cookie como fonte principal do token
      const token = cookieToken || headerToken;
        
      if (!token) {
        return { isAuthenticated: false };
      }

      // Verificar a validade do token
      const result = await this.authService.checkAuth(token);
      return result;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { isAuthenticated: false };
    }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('auth_token');
    return { success: true, message: 'Logout realizado com sucesso' };
  }
}
