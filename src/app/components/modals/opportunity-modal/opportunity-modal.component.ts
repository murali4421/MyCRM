import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Opportunity, OpportunityStage, Contact, Activity } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-opportunity-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeOpportunityModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-xl z-50 flex flex-col" [class]="themeService.c('bg-primary')">
      <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
        <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Opportunity' : 'Opportunity Details' }}</h2>
        <button (click)="uiService.closeOpportunityModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
          <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <form #oppForm="ngForm" (ngSubmit)="saveOpportunity(oppForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Opportunity Name</label>
                <input type="text" name="name" [ngModel]="opportunityModel()?.name" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Company</label>
                <select name="companyId" [ngModel]="opportunityModel()?.companyId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    <option value="" disabled>Select a company</option>
                    @for(company of dataService.companies(); track company.id) {
                        <option [value]="company.id">{{company.name}}</option>
                    }
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Value (USD)</label>
                <input type="number" name="value" [ngModel]="opportunityModel()?.value" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
              </div>

               <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Stage</label>
                <select name="stage" [ngModel]="opportunityModel()?.stage" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    @for(stage of opportunityStages; track stage) {
                        <option [value]="stage">{{stage}}</option>
                    }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Close Date</label>
                <input type="date" name="closeDate" [ngModel]="opportunityModel()?.closeDate" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Owner</label>
                <select name="ownerId" [ngModel]="opportunityModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>
           </div>

           <!-- AI Assistant -->
            @if(!isNew) {
                <div class="mt-6 pt-6 border-t" [class]="themeService.c('border-primary')">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-semibold flex items-center" [class]="themeService.c('text-primary')">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" [class]="themeService.c('text-accent')" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" /></svg>
                            AI Assistant
                        </h3>
                         <button type="button" (click)="getAiSuggestion()" [disabled]="geminiService.isGeneratingAction()" class="px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed" [class]="themeService.c('bg-accent-subtle') + ' ' + themeService.c('text-accent-subtle') + ' ' + themeService.c('hover:bg-accent-subtle-hover')">
                            @if (geminiService.isGeneratingAction()) {
                                <span class="flex items-center">
                                    <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" [class]="themeService.c('border-accent')"></div>
                                    Thinking...
                                </span>
                            } @else {
                                <span>Get Next Best Action</span>
                            }
                        </button>
                    </div>
                     @if (aiSuggestion()) {
                      <div class="p-4 rounded-md border" [class]="themeService.c('bg-base') + ' ' + themeService.c('border-primary')">
                          <p class="text-sm" [class]="themeService.c('text-base')">{{ aiSuggestion() }}</p>
                      </div>
                    } @else if (!geminiService.isGeneratingAction()) {
                        <p class="text-sm" [class]="themeService.c('text-secondary')">Click the button to get a suggestion for your next step with this deal.</p>
                    }
                </div>
            }
        </div>
        <footer class="p-4 flex-shrink-0" [class]="themeService.c('bg-base') + ' border-t ' + themeService.c('border-primary')">
            <div class="flex justify-end gap-2">
                <button type="button" (click)="uiService.closeOpportunityModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="oppForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Opportunity</button>
                @if(!isNew) {
                    <button type="button" (click)="deleteOpportunity()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-danger-subtle') + ' ' + themeService.c('border-danger-subtle') + ' ' + themeService.c('text-danger') + ' ' + themeService.c('hover:bg-danger-subtle-hover')">Delete</button>
                }
            </div>
        </footer>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpportunityModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  geminiService = inject(GeminiService);
  themeService = inject(ThemeService);

  isNew = false;
  opportunityModel = signal<Partial<Opportunity>>({});
  aiSuggestion = signal<string | null>(null);
  
  opportunityStages = Object.values(OpportunityStage);

  relatedActivities = computed(() => {
    const oppId = this.opportunityModel()?.id;
    if (!oppId) return [];
    return this.dataService.activities().filter(a => a.relatedEntity?.type === 'opportunity' && a.relatedEntity.id === oppId);
  });

  constructor() {
    effect(() => {
      const selectedOpportunity = this.uiService.selectedOpportunity();
      untracked(() => {
        if (selectedOpportunity === undefined) return;

        if (selectedOpportunity === null) {
          this.isNew = true;
          this.opportunityModel.set({ 
              ownerId: this.authService.currentUser()?.id,
              stage: OpportunityStage.Prospecting,
              closeDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // Default to 1 month
          });
        } else {
          this.isNew = false;
          this.opportunityModel.set({ ...selectedOpportunity });
        }
        this.aiSuggestion.set(null);
      });
    });
  }

  async getAiSuggestion() {
    const opp = this.opportunityModel();
    if (!opp || !opp.id) return;

    this.aiSuggestion.set(null);
    const suggestion = await this.geminiService.generateNextBestAction(opp as Opportunity, this.relatedActivities());
    this.aiSuggestion.set(suggestion);
  }

  async saveOpportunity(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.opportunityModel(), ...form.value };

    if (this.isNew) {
      const newOpp: Opportunity = {
        ...formData,
        id: `opp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Opportunity;
      await this.dataService.addOpportunity(newOpp);
    } else {
      await this.dataService.updateOpportunity(formData as Opportunity);
    }
    this.uiService.closeOpportunityModal();
  }
  
  async deleteOpportunity() {
    const oppId = this.opportunityModel()?.id;
    if (oppId && confirm('Are you sure you want to delete this opportunity?')) {
        await this.dataService.deleteOpportunity(oppId);
        this.uiService.closeOpportunityModal();
    }
  }
}
