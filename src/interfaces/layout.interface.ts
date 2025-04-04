export interface BannerSize {
    name: string;
    width: number;
    height: number;
    orientation?: 'vertical' | 'horizontal' | 'square';
}

export interface ElementStyle {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
    [key: string]: any; // Para outras propriedades de estilo
}

export interface EditorElement {
    id: string;
    type: string;
    content: string;
    style: ElementStyle;
    sizeId?: string;
    originalId?: string;
    columns?: any;
    [key: string]: any; // Para outras propriedades do elemento
}

export interface LayoutData {
    currentFormat: BannerSize;
    elements: EditorElement[];
    targetFormats: BannerSize[];
}

export interface RefinedLayout {
    format: BannerSize;
    elements: EditorElement[];
}

export interface PerplexityResponse {
    data: {
        choices: Array<{
            message: {
                content: string;
            };
        }>;
    };
}
