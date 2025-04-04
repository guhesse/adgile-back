// import { Injectable, Logger } from '@nestjs/common';
// import { HttpService } from '@nestjs/axios';
// import { firstValueFrom } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class PerplexityService {
//     private readonly logger = new Logger(PerplexityService.name);

//     constructor(
//         private readonly httpService: HttpService,
//         private readonly configService: ConfigService,
//     ) {
//         this.logger.log('PerplexityService initialized');
//     }

//     async callPerplexityAPI(prompt: string): Promise<any> {
//         const apiKey = this.configService.get<string>('PERPLEXITY_API_KEY');
//         if (!apiKey) {
//             throw new Error('Perplexity API Key is not configured');
//         }

//         const requestBody = {
//             model: 'sonar-pro',
//             search_context_size: 'low',
//             messages: [
//                 {
//                     role: 'system',
//                     content: 'You are an expert in design and layout adaptation.',
//                 },
//                 {
//                     role: 'user',
//                     content: prompt,
//                 },
//             ],
//             max_tokens: 4000,
//         };

//         try {
//             const response = await firstValueFrom(
//                 this.httpService.post(
//                     'https://api.perplexity.ai/chat/completions',
//                     requestBody,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${apiKey}`,
//                             'Content-Type': 'application/json',
//                         },
//                     },
//                 ).pipe(
//                     catchError((error) => {
//                         this.logger.error(`Error calling Perplexity API: ${error.message}`);
//                         if (error.response) {
//                             this.logger.error(`Response status: ${error.response.status}`);
//                             this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
//                             throw new Error(`Perplexity API server error: ${error.response.status}`);
//                         } else if (error.request) {
//                             this.logger.error('No response from Perplexity API server');
//                             throw new Error('No response from Perplexity API server');
//                         } else {
//                             throw new Error(`Configuration error: ${error.message}`);
//                         }
//                     }),
//                 ),
//             );

//             this.logger.log('Response received from Perplexity API');
//             return response.data;
//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//             this.logger.error(`Failed to call Perplexity API: ${errorMessage}`);
//             throw new Error(`Failed to call Perplexity API: ${errorMessage}`);
//         }
//     }
// }