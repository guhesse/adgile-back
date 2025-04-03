/**
 * Interface para serviços de CDN
 * Permite implementações diferentes (Bunny, AWS, etc) mantendo a mesma API
 */
export interface ICdnService {
  /**
   * Faz upload de uma imagem para o CDN e retorna a URL
   * @param imageBuffer Buffer da imagem
   * @param filename Nome do arquivo
   * @param mimeType Tipo MIME da imagem
   */
  uploadImage(imageBuffer: Buffer, filename: string, mimeType: string): Promise<string>;
  
  /**
   * Faz upload de uma imagem base64 para o CDN e retorna a URL
   * @param base64Data String base64 da imagem
   * @param filename Nome do arquivo
   */
  uploadBase64Image(base64Data: string, filename: string): Promise<string>;
  
  /**
   * Remove uma imagem do CDN
   * @param imageUrl URL da imagem a ser removida
   */
  deleteImage(imageUrl: string): Promise<boolean>;
}
