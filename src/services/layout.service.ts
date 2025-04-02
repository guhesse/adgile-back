import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLayoutDto, UpdateLayoutDto } from '../dtos/layout.dto';

@Injectable()
export class LayoutService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.layout.findMany({
      include: {
        category: true,
      },
    });
  }

  async findById(id: number) {
    const layout = await this.prisma.layout.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!layout) {
      throw new NotFoundException(`Layout com ID ${id} não encontrado`);
    }

    return layout;
  }

  async create(data: CreateLayoutDto) {
    // Assegurar que o conteúdo seja armazenado como JSON string
    const contentString = typeof data.content === 'string' 
      ? data.content 
      : JSON.stringify(data.content);

    return this.prisma.layout.create({
      data: {
        ...data,
        content: contentString,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: number, data: UpdateLayoutDto) {
    // Verificar se o layout existe
    await this.findById(id);

    // Processar o conteúdo, se fornecido
    let processedData = { ...data };
    if (data.content && typeof data.content !== 'string') {
      processedData.content = JSON.stringify(data.content);
    }

    return this.prisma.layout.update({
      where: { id },
      data: processedData,
      include: {
        category: true,
      },
    });
  }

  async remove(id: number) {
    // Verificar se o layout existe
    await this.findById(id);

    return this.prisma.layout.delete({
      where: { id },
    });
  }

  async findByCategoryId(categoryId: number) {
    return this.prisma.layout.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
    });
  }
}
