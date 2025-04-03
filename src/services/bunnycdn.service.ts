import { Injectable, Logger } from '@nestjs/common';
import { ICdnService } from '../interfaces/ICdnService';
import axios from 'axios';
import path from 'path';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BunnyCdnService implements ICdnService {
    private readonly pullZoneUrl: string;
    private readonly apiKey: string;
    private readonly storageZone: string;
    private readonly logger = new Logger(BunnyCdnService.name);

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('BUNNY_CDN_API_KEY')?.trim() || '';
        this.storageZone = this.configService.get<string>('BUNNY_CDN_STORAGE_ZONE') || 'assets-adgile';
        this.pullZoneUrl = 'image-assets-adgile.b-cdn.net';

        this.logger.log(`BunnyCdnService inicializado com storage zone: '${this.storageZone}'`);
        this.logger.log(`URL da Pull Zone: ${this.pullZoneUrl}`);

        if (!this.apiKey) {
            this.logger.error('BUNNY_CDN_API_KEY não está configurado. O serviço de CDN não funcionará.');
        } else {
            const maskedKey = this.apiKey.substring(0, 5) + '...' + this.apiKey.substring(this.apiKey.length - 5);
            this.logger.log(`API Key configurada: ${maskedKey}`);
        }
    }

    private sanitizeFilename(filename: string): string {
        return filename
            .normalize("NFD") // Remove acentos
            .replace(/[\u0300-\u036f]/g, "") // Remove marcas de diacríticos
            .replace(/[^a-zA-Z0-9._-]/g, "_"); // Substitui caracteres especiais por "_"
    }

    async uploadImage(imageBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
        const sanitizedFilename = this.sanitizeFilename(filename);
        const uniqueFilename = this.generateUniqueFilename(sanitizedFilename);
        this.logger.log(`Tentando fazer upload da imagem com nome sanitizado: ${uniqueFilename}`);

        const storageEndpoint = 'storage.bunnycdn.com';
        const uploadUrl = `https://${storageEndpoint}/${this.storageZone}/${uniqueFilename}`;
        this.logger.log(`URL de upload: ${uploadUrl}`);

        const headers = {
            'AccessKey': this.apiKey,
            'Content-Type': mimeType
        };

        try {
            const response = await axios.put(uploadUrl, imageBuffer, { headers });
            this.logger.log(`Upload concluído com status: ${response.status}`);
            const imageUrl = `https://${this.pullZoneUrl}/${uniqueFilename}`;
            this.logger.log(`URL pública da imagem: ${imageUrl}`);
            return imageUrl;
        } catch (error) {
            this.logger.error(`Erro ao fazer upload da imagem para o CDN: ${error.message}`);
            if (error.response) {
                this.logger.error(`Status: ${error.response.status}`);
                this.logger.error(`Dados da resposta: ${JSON.stringify(error.response.data || {})}`);
            }
            throw new Error('Falha ao enviar imagem para o BunnyCDN');
        }
    }

    async uploadBase64Image(base64Data: string, filename: string): Promise<string> {
        const base64Image = base64Data.split(';base64,').pop();
        if (!base64Image) {
            throw new Error('Dados base64 inválidos');
        }

        const imageBuffer = Buffer.from(base64Image, 'base64');
        const mimeType = base64Data.substring(
            base64Data.indexOf('data:') + 5,
            base64Data.indexOf(';base64')
        );

        return this.uploadImage(imageBuffer, filename, mimeType);
    }

    async deleteImage(imageUrl: string): Promise<boolean> {
        const filename = imageUrl.split('/').pop();
        if (!filename) return false;

        const deleteUrl = `https://storage.bunnycdn.com/${this.storageZone}/${filename}`;
        try {
            await axios.delete(deleteUrl, {
                headers: {
                    'AccessKey': this.apiKey
                }
            });
            this.logger.log(`Imagem excluída com sucesso: ${filename}`);
            return true;
        } catch (error) {
            this.logger.error('Erro ao excluir imagem do CDN:', error);
            return false;
        }
    }

    private generateUniqueFilename(originalFilename: string): string {
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalFilename);
        const baseName = path.basename(originalFilename, extension);

        return `${baseName}-${timestamp}-${randomString}${extension}`;
    }
}
