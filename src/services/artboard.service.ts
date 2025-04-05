import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateArtboardDto } from '../dtos/create-artboard.dto';

@Injectable()
export class ArtboardService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.artboard.findMany({
      include: {
        Layout: true,
        Element: true,
      },
    });
  }

  async findById(artboard_id: number) {
    const artboard = await this.prisma.artboard.findUnique({
      where: { artboard_id },
      include: {
        Layout: true,
        Element: true,
      },
    });

    if (!artboard) {
      throw new NotFoundException(`Artboard com ID ${artboard_id} não encontrado`);
    }

    return artboard;
  }

  async create(createArtboardDto: CreateArtboardDto, tenant_id: number, created_by: number) {
    return this.prisma.artboard.create({
      data: {
        name: createArtboardDto.name || 'Novo Artboard',
        layout_id: createArtboardDto.layout_id,
        width: createArtboardDto.width,
        height: createArtboardDto.height,
        tenant_id,
        created_by,
      },
      include: {
        Layout: true,
        Element: true,
      },
    });
  }

  async update(artboard_id: number, data: Partial<CreateArtboardDto>) {
    // Verificar se o artboard existe
    await this.findById(artboard_id);

    return this.prisma.artboard.update({
      where: { artboard_id },
      data,
      include: {
        Layout: true,
        Element: true,
      },
    });
  }

  async remove(artboard_id: number) {
    // Verificar se o artboard existe
    await this.findById(artboard_id);

    return this.prisma.artboard.delete({
      where: { artboard_id },
    });
  }

  async findByLayoutId(layout_id: number) {
    return this.prisma.artboard.findMany({
      where: { layout_id },
      include: {
        Layout: true,
        Element: true,
      },
    });
  }

  async findByTenantId(tenant_id: number) {
    return this.prisma.artboard.findMany({
      where: { tenant_id },
      include: {
        Layout: true,
        Element: true,
      },
    });
  }
}