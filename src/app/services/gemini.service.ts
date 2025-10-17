/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Injectable, signal } from '@angular/core';
import { NgForm } from '@angular/forms';
import { GoogleGenAI, Type } from '@google/genai';
import { Activity, Opportunity, Contact, Company } from '../models/crm.models';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | undefined;
  isGeneratingLogo = signal(false);
  isGeneratingSummary = signal(false);
  isGeneratingAction = signal(false);
  isGeneratingLeadScore = signal(false);

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

  async generateNextBestAction(opportunity: Opportunity, activities: Activity[]): Promise<string | null> {
    if (!this.ai) return null;
    this.isGeneratingAction.set(true);
    try {
      const activityHistory = activities
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5) // Take last 5 activities
        .map(a => `- ${a.type}: ${a.subject} on ${new Date(a.startTime).toLocaleDateString()}`)
        .join('\n');

      const prompt = `
        As a CRM sales assistant, analyze the following opportunity and its recent activity to suggest the single best next action.
        The action should be concise, actionable, and specific.

        Opportunity Details:
        - Name: ${opportunity.name}
        - Stage: ${opportunity.stage}
        - Value: $${opportunity.value}
        - Expected Close Date: ${opportunity.closeDate}

        Recent Activity History:
        ${activityHistory || 'No recent activities.'}

        Based on this, what is the single most effective next action to move this deal forward?
      `;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text.trim();
    } catch (error) {
      console.error('Error generating next best action:', error);
      return 'Could not generate a suggestion at this time.';
    } finally {
      this.isGeneratingAction.set(false);
    }
  }

  async generateNextBestActionForContact(contact: Contact, activities: Activity[]): Promise<string | null> {
    if (!this.ai) return null;
    this.isGeneratingAction.set(true);
    try {
      const activityHistory = activities
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5) // Take last 5 activities
        .map(a => `- ${a.type}: ${a.subject} on ${new Date(a.startTime).toLocaleDateString()}`)
        .join('\n');

      const prompt = `
        As a CRM sales assistant, analyze the following contact and their recent activity to suggest the single best next action.
        The goal is to build the relationship, create a new sales opportunity, or re-engage them.
        The action should be concise, actionable, and specific.

        Contact Details:
        - Name: ${contact.name}
        - Email: ${contact.email}
        - Role: ${contact.roleInCompany || 'Not specified'}

        Recent Activity History:
        ${activityHistory || 'No recent activities.'}

        Based on this, what is the single most effective next action to take with this contact?
      `;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text.trim();
    } catch (error) {
      console.error('Error generating next best action for contact:', error);
      return 'Could not generate a suggestion at this time.';
    } finally {
      this.isGeneratingAction.set(false);
    }
  }

  async generateLeadScore(contact: Contact, company: Company | undefined): Promise<'Hot' | 'Warm' | 'Cold' | null> {
    if (!this.ai) return null;
    this.isGeneratingLeadScore.set(true);
    try {
      const prompt = `
        As a CRM sales assistant, analyze the following contact details and classify them as a 'Hot', 'Warm', or 'Cold' lead.
        - A 'Hot' lead is typically a decision-maker (e.g., Director, VP, C-level) in a relevant industry.
        - A 'Warm' lead is a manager or senior individual who seems influential.
        - A 'Cold' lead is a junior-level contact or someone in a less relevant role.

        Contact Details:
        - Name: ${contact.name}
        - Role: ${contact.roleInCompany || 'Not specified'}
        - Company: ${company?.name || 'Not specified'}
        - Industry: ${company?.industry || 'Not specified'}

        Based on these details, what is the lead score?
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              leadScore: {
                type: Type.STRING,
                enum: ['Hot', 'Warm', 'Cold'],
              },
            },
            required: ['leadScore'],
          },
        },
      });

      const result = JSON.parse(response.text.trim());
      return result.leadScore;

    } catch (error) {
      console.error('Error generating lead score:', error);
      return null;
    } finally {
      this.isGeneratingLeadScore.set(false);
    }
  }
}