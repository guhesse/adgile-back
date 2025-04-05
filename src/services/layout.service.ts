import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLayoutDto } from '../dtos/create-layout.dto';

@Injectable()
export class LayoutService {
    private readonly logger = new Logger(LayoutService.name);

    constructor(
        private readonly prisma: PrismaService
    ) {}

    async findAll(tenantId?: number) {
        const where = tenantId ? { tenant_id: tenantId } : {};
        return this.prisma.layout.findMany({
            where,
            orderBy: {
                created_at: 'desc',
            },
            include: {
                Artboard: true,
            },
        });
    }

    async findById(id: number) {
        const layout = await this.prisma.layout.findUnique({
            where: { layout_id: id },
            include: {
                Artboard: true,
            },
        });

        if (!layout) {
            throw new NotFoundException(`Layout com ID ${id} não encontrado`);
        }

        return layout;
    }

    async create(data: CreateLayoutDto) {
        this.logger.log(`Criando layout com categoria: ${data.categoryId || 'nenhuma'}`);
        
        return this.prisma.layout.create({
            data: {
                name: data.name,
                description: data.description,
                content: data.content,
                category_id: data.categoryId, // Usando a string diretamente
                tenant_id: data.tenantId || 1,
                created_by: data.createdBy || 1,
            },
            include: {
                Artboard: true,
            },
        });
    }

    async update(id: number, data: Partial<CreateLayoutDto>) {
        await this.findById(id);

        return this.prisma.layout.update({
            where: { layout_id: id },
            data: {
                name: data.name,
                description: data.description,
                content: data.content,
                category_id: data.categoryId, // Usando a string diretamente
            },
            include: {
                Artboard: true,
            },
        });
    }

    async remove(id: number) {
        await this.findById(id);
        return this.prisma.layout.delete({
            where: { layout_id: id },
        });
    }

    async findByCategoryId(categoryId: number) {
        // Este método ainda precisa existir para compatibilidade com código existente
        // mas podemos redirecionar para o método que usa string
        return this.findByCategoryString(categoryId.toString());
    }
    
    async findByCategoryString(categoryString: string) {
        return this.prisma.layout.findMany({
            where: { category_id: categoryString },
            orderBy: {
                created_at: 'desc',
            },
            include: {
                Artboard: true,
            },
        });
    }
}