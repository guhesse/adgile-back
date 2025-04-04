import { BannerSize, EditorElement } from '../interfaces/layout.interface';
import { Logger } from '@nestjs/common';

export class LayoutAdapterUtils {
    private static readonly logger = new Logger('LayoutAdapterUtils');

    static adaptElementToNewFormat(
        element: EditorElement,
        currentFormat: BannerSize,
        targetFormat: BannerSize
    ): EditorElement {
        // Gerar um novo ID para o elemento adaptado
        const newId = `${element.id}-${targetFormat.name.toLowerCase().replace(/\s+/g, '-')}`;

        // Calcular as proporções entre os formatos
        const widthRatio = targetFormat.width / currentFormat.width;
        const heightRatio = targetFormat.height / currentFormat.height;
        const smallerRatio = Math.min(widthRatio, heightRatio);

        // Criar uma cópia do elemento original para adaptação
        let adaptedElement: EditorElement = {
            ...element,
            id: newId,
            originalId: element.id,
            sizeId: targetFormat.name,
            style: { ...element.style }
        };

        // Log para debugging
        this.logger.debug(`Adaptando elemento ${element.id} de ${currentFormat.width}x${currentFormat.height} para ${targetFormat.width}x${targetFormat.height}`);
        this.logger.debug(`Razões - Largura: ${widthRatio.toFixed(2)}, Altura: ${heightRatio.toFixed(2)}`);

        // Aplicar regras de adaptação específicas por tipo de elemento
        switch (element.type) {
            case 'text':
                this.adaptTextElement(adaptedElement, element, currentFormat, targetFormat, widthRatio, heightRatio, smallerRatio);
                break;
            case 'image':
                this.adaptImageElement(adaptedElement, element, currentFormat, targetFormat, widthRatio, heightRatio);
                break;
            case 'container':
                this.adaptContainerElement(adaptedElement, element, targetFormat, widthRatio, heightRatio);
                break;
            default:
                this.adaptDefaultElement(adaptedElement, element, targetFormat, widthRatio, heightRatio);
                break;
        }

        // Limpar propriedades de porcentagem
        delete adaptedElement.style.xPercent;
        delete adaptedElement.style.yPercent;
        delete adaptedElement.style.widthPercent;
        delete adaptedElement.style.heightPercent;

        // Log de resultado
        this.logger.debug(`Elemento adaptado: ${JSON.stringify({
            original: { 
                x: element.style.x, 
                y: element.style.y, 
                width: element.style.width, 
                height: element.style.height,
                fontSize: element.style.fontSize
            },
            adapted: { 
                x: adaptedElement.style.x, 
                y: adaptedElement.style.y, 
                width: adaptedElement.style.width, 
                height: adaptedElement.style.height,
                fontSize: adaptedElement.style.fontSize
            }
        })}`);

        return adaptedElement;
    }

    private static adaptTextElement(
        adaptedElement: EditorElement,
        element: EditorElement,
        currentFormat: BannerSize,
        targetFormat: BannerSize,
        widthRatio: number,
        heightRatio: number,
        smallerRatio: number
    ): void {
        // Para textos, usar uma escala mais conservadora
        const textScaleFactor = smallerRatio * 0.95;

        // Posição X - Manter alinhamentos com bordas se aplicável
        if (element.style.x <= 10) {
            // Colado à esquerda
            adaptedElement.style.x = element.style.x;
        } else if (element.style.x + element.style.width >= currentFormat.width - 10) {
            // Colado à direita
            adaptedElement.style.x = targetFormat.width - (element.style.width * widthRatio);
        } else {
            // Proporcional
            adaptedElement.style.x = Math.max(0, element.style.x * widthRatio);
        }

        // Posição Y
        adaptedElement.style.y = Math.max(0, element.style.y * heightRatio);

        // Largura - Garantir mínimo legível
        adaptedElement.style.width = Math.max(100, element.style.width * widthRatio);

        // Altura
        adaptedElement.style.height = Math.max(20, element.style.height * heightRatio);

        // Tamanho da fonte
        if (element.style.fontSize) {
            // Limites para garantir legibilidade
            const minFontSize = 14;
            const maxFontSize = 72;

            // Aplicar escala ao tamanho da fonte
            const scaledFontSize = element.style.fontSize * textScaleFactor;
            adaptedElement.style.fontSize = Math.max(minFontSize, Math.min(maxFontSize, scaledFontSize));

            // Ajustes baseados no tipo de texto
            if (element.id.toLowerCase().includes('title') || element.id.toLowerCase().includes('header')) {
                adaptedElement.style.fontSize = Math.max(18, adaptedElement.style.fontSize);
            }
            if (element.id.toLowerCase().includes('footer') || element.id.toLowerCase().includes('description')) {
                adaptedElement.style.fontSize = Math.min(adaptedElement.style.fontSize, 16);
            }
        }

        // Preservar alinhamento
        adaptedElement.style.alignment = element.style.alignment;

        this.logger.debug(`Texto adaptado: fontSize original=${element.style.fontSize}, novo=${adaptedElement.style.fontSize}`);
    }

    private static adaptImageElement(
        adaptedElement: EditorElement,
        element: EditorElement,
        currentFormat: BannerSize,
        targetFormat: BannerSize,
        widthRatio: number,
        heightRatio: number
    ): void {
        // Calcular proporção da imagem
        const aspectRatio = element.style.width / element.style.height;

        // Verificar adjacência às bordas
        const isStickingToLeftBorder = element.style.x <= 5;
        const isStickingToRightBorder = element.style.x + element.style.width >= currentFormat.width - 5;
        const isStickingToTopBorder = element.style.y <= 5;
        const isStickingToBottomBorder = element.style.y + element.style.height >= currentFormat.height - 5;

        // Identificar tipo de imagem
        const isLogo = element.id.toLowerCase().includes('logo') ||
            (element.style.width < currentFormat.width * 0.3 && element.style.height < currentFormat.height * 0.2);
        const isBanner = element.style.width >= currentFormat.width * 0.9 || element.style.height >= currentFormat.height * 0.3;

        if (isLogo) {
            // Logos têm tratamento especial
            const logoScale = Math.min(widthRatio, heightRatio) * 0.9;
            adaptedElement.style.width = element.style.width * logoScale;
            adaptedElement.style.height = element.style.height * logoScale;

            // Manter posição relativa às bordas
            if (isStickingToLeftBorder && isStickingToTopBorder) {
                adaptedElement.style.x = 5;
                adaptedElement.style.y = 5;
            } else if (isStickingToRightBorder && isStickingToTopBorder) {
                adaptedElement.style.x = targetFormat.width - adaptedElement.style.width - 5;
                adaptedElement.style.y = 5;
            } else if (isStickingToLeftBorder && isStickingToBottomBorder) {
                adaptedElement.style.x = 5;
                adaptedElement.style.y = targetFormat.height - adaptedElement.style.height - 5;
            } else if (isStickingToRightBorder && isStickingToBottomBorder) {
                adaptedElement.style.x = targetFormat.width - adaptedElement.style.width - 5;
                adaptedElement.style.y = targetFormat.height - adaptedElement.style.height - 5;
            } else {
                // Posição relativa
                const relativeX = element.style.x / currentFormat.width;
                const relativeY = element.style.y / currentFormat.height;
                adaptedElement.style.x = relativeX * targetFormat.width;
                adaptedElement.style.y = relativeY * targetFormat.height;
            }

            this.logger.debug(`Logo adaptado: (${adaptedElement.style.width}x${adaptedElement.style.height})`);
        } else if (isBanner) {
            // Banners grandes se adaptam ao formato
            if (isStickingToTopBorder) {
                // Banner de topo
                adaptedElement.style.x = 0;
                adaptedElement.style.y = 0;
                adaptedElement.style.width = targetFormat.width;
                adaptedElement.style.height = Math.min(targetFormat.height * 0.3, targetFormat.width / aspectRatio);
            } else if (isStickingToBottomBorder) {
                // Banner de rodapé
                adaptedElement.style.x = 0;
                adaptedElement.style.width = targetFormat.width;
                adaptedElement.style.height = Math.min(targetFormat.height * 0.3, targetFormat.width / aspectRatio);
                adaptedElement.style.y = targetFormat.height - adaptedElement.style.height;
            } else {
                // Banner central
                adaptedElement.style.width = targetFormat.width * 0.95;
                adaptedElement.style.height = adaptedElement.style.width / aspectRatio;
                adaptedElement.style.x = (targetFormat.width - adaptedElement.style.width) / 2;
                const relativeY = element.style.y / currentFormat.height;
                adaptedElement.style.y = relativeY * targetFormat.height;
            }

            this.logger.debug(`Banner adaptado: (${adaptedElement.style.width}x${adaptedElement.style.height})`);
        } else {
            // Imagens padrão
            if (widthRatio < heightRatio) {
                // Limitado pela largura
                const newWidth = Math.min(targetFormat.width * 0.9, element.style.width * widthRatio);
                const newHeight = newWidth / aspectRatio;
                adaptedElement.style.width = newWidth;
                adaptedElement.style.height = newHeight;
            } else {
                // Limitado pela altura
                const newHeight = Math.min(targetFormat.height * 0.7, element.style.height * heightRatio);
                const newWidth = newHeight * aspectRatio;
                adaptedElement.style.height = newHeight;
                adaptedElement.style.width = newWidth;
            }

            // Posicionamento relativo
            const relativeX = element.style.x / currentFormat.width;
            const relativeY = element.style.y / currentFormat.height;
            adaptedElement.style.x = relativeX * targetFormat.width;
            adaptedElement.style.y = relativeY * targetFormat.height;

            // Garantir que a imagem não ultrapasse os limites
            adaptedElement.style.x = Math.min(
                adaptedElement.style.x, 
                Math.max(0, targetFormat.width - adaptedElement.style.width)
            );
            adaptedElement.style.y = Math.min(
                adaptedElement.style.y, 
                Math.max(0, targetFormat.height - adaptedElement.style.height)
            );

            this.logger.debug(`Imagem adaptada: (${adaptedElement.style.width.toFixed(0)}x${adaptedElement.style.height.toFixed(0)})`);
        }
    }

    private static adaptContainerElement(
        adaptedElement: EditorElement,
        element: EditorElement,
        targetFormat: BannerSize,
        widthRatio: number,
        heightRatio: number
    ): void {
        // Posicionamento proporcional
        adaptedElement.style.x = Math.max(0, element.style.x * widthRatio);
        adaptedElement.style.y = Math.max(0, element.style.y * heightRatio);

        // Dimensionamento com limites
        adaptedElement.style.width = Math.min(
            targetFormat.width * 0.95,
            Math.max(100, element.style.width * widthRatio)
        );
        adaptedElement.style.height = Math.min(
            targetFormat.height * 0.95,
            Math.max(100, element.style.height * heightRatio)
        );

        // Garantir que não ultrapasse os limites
        adaptedElement.style.x = Math.min(adaptedElement.style.x, targetFormat.width - adaptedElement.style.width);
        adaptedElement.style.y = Math.min(adaptedElement.style.y, targetFormat.height - adaptedElement.style.height);

        this.logger.debug(`Container adaptado: (${adaptedElement.style.width.toFixed(0)}x${adaptedElement.style.height.toFixed(0)})`);
    }

    private static adaptDefaultElement(
        adaptedElement: EditorElement,
        element: EditorElement,
        targetFormat: BannerSize,
        widthRatio: number,
        heightRatio: number
    ): void {
        // Posicionamento proporcional
        adaptedElement.style.x = Math.max(0, element.style.x * widthRatio);
        adaptedElement.style.y = Math.max(0, element.style.y * heightRatio);
        
        // Dimensionamento com limites mínimos
        adaptedElement.style.width = Math.max(20, element.style.width * widthRatio);
        adaptedElement.style.height = Math.max(20, element.style.height * heightRatio);

        // Garantir que não ultrapasse os limites
        adaptedElement.style.x = Math.min(adaptedElement.style.x, targetFormat.width - adaptedElement.style.width);
        adaptedElement.style.y = Math.min(adaptedElement.style.y, targetFormat.height - adaptedElement.style.height);

        this.logger.debug(`Elemento padrão adaptado: (${adaptedElement.style.width.toFixed(0)}x${adaptedElement.style.height.toFixed(0)})`);
    }
}
