import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BunnyCdnService } from '../services/bunnycdn.service';
import { promises as fs } from 'fs';

// Interface para o arquivo enviado pelo Multer
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

@ApiTags('cdn')
@Controller('cdn')
export class CdnController {
    private readonly logger = new Logger(CdnController.name);

    constructor(private readonly cdnService: BunnyCdnService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Faz upload de um arquivo de imagem' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './temp/uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async uploadImage(@UploadedFile() file: MulterFile) {
        this.logger.log(`Recebido upload de arquivo: ${file?.originalname || 'sem nome'}`);

        if (!file) {
            this.logger.error('Nenhum arquivo foi enviado');
            throw new BadRequestException('Nenhuma imagem enviada');
        }

        this.logger.log(`Arquivo recebido: ${file.originalname}, tamanho: ${file.size} bytes, tipo: ${file.mimetype}`);

        try {
            // Ler arquivo do disco
            this.logger.log(`Lendo arquivo do caminho: ${file.path}`);
            const imageBuffer = await fs.readFile(file.path);
            this.logger.log(`Arquivo lido com sucesso, tamanho do buffer: ${imageBuffer.length} bytes`);

            // Enviar para CDN
            this.logger.log(`Enviando arquivo para BunnyCDN...`);
            const imageUrl = await this.cdnService.uploadImage(
                imageBuffer,
                file.originalname,
                file.mimetype,
            );
            
            // Determinar se a URL é base64
            const isBase64 = imageUrl.startsWith('data:');
            if (isBase64) {
                this.logger.warn('Upload processado no modo fallback (base64)');
            } else {
                this.logger.log(`Upload concluído com sucesso! URL: ${imageUrl}`);
            }

            // Limpar arquivo temporário
            await fs.unlink(file.path).catch(err => {
                this.logger.error(`Erro ao excluir arquivo temporário: ${err.message}`);
            });

            return { url: imageUrl };
        } catch (error) {
            this.logger.error(`Erro no upload de imagem:`, error);
            throw new InternalServerErrorException(`Falha ao processar upload de imagem: ${error.message}`);
        }
    }

    @Post('upload-base64')
    @ApiOperation({ summary: 'Faz upload de uma imagem em formato base64' })
    async uploadBase64Image(@Body() body: { image: string; filename: string }) {
        const { image, filename } = body;

        if (!image || !filename) {
            throw new BadRequestException('Dados de imagem ou nome do arquivo não fornecidos');
        }

        try {
            const imageUrl = await this.cdnService.uploadBase64Image(image, filename);
            return { url: imageUrl };
        } catch (error) {
            console.error('Erro no upload de imagem base64:', error);
            throw new InternalServerErrorException('Falha ao processar upload de imagem base64');
        }
    }

    @Delete('images')
    @ApiOperation({ summary: 'Remove uma imagem do CDN' })
    async deleteImage(@Body() body: { url: string }) {
        const { url } = body;

        if (!url) {
            throw new BadRequestException('URL da imagem não fornecida');
        }

        const success = await this.cdnService.deleteImage(url);

        if (!success) {
            throw new BadRequestException('Não foi possível excluir a imagem');
        }

        return { message: 'Imagem excluída com sucesso' };
    }
}
