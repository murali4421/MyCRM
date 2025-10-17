import { Injectable, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | undefined;
  isGeneratingLogo = signal(false);
  isGeneratingSummary = signal(false);

  constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error(
        'API_KEY environment variable not set. AI features will be disabled.'
      );
    }
  }

  async generateLogo(
    promptConfig: { companyName: string; industry: string }
  ): Promise<string | null> {
    if (!this.ai || !promptConfig.companyName) return null;
    this.isGeneratingLogo.set(true);
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `minimalist, flat, vector logo for a company called "${promptConfig.companyName}" in the ${promptConfig.industry} industry. solid background color.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });
      return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (error) {
      console.error('Error generating logo:', error);
      return null;
    } finally {
      this.isGeneratingLogo.set(false);
    }
  }

  async generateActivitySummary(textToSummarize: string): Promise<{subject: string, description: string} | null> {
    if (!this.ai || !textToSummarize) return null;
    this.isGeneratingSummary.set(true);
    try {
      const prompt = `You are a helpful CRM assistant. From the following text, extract a concise summary and generate a short, descriptive subject line.
        Respond in JSON format with "subject" and "description" keys. Text: "${textToSummarize}"`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              description: { type: Type.STRING },
            },
          },
        },
      });
      return JSON.parse(response.text.trim());
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    } finally {
      this.isGeneratingSummary.set(false);
    }
  }
}