import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Opportunity, OpportunityStage, Activity, Task, FileAttachment, Quote } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';
import { ThemeService } from '../../../services/theme.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface DisplayFile extends FileAttachment {
  isFromQuote?: boolean;
  quoteId?: string;
}

@Component({
  selector: 'app-opportunity-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeOpportunityModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-2xl z-50 flex flex-col" [class]="themeService.c('bg-primary')">
      <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
        <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Opportunity' : 'Opportunity Details' }}</h2>
        <button (click)="uiService.closeOpportunityModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
          <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      @if (!isNew) {
        <div class="border-b" [class]="themeService.c('border-primary')">
            <nav class="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                <button (click)="activeTab.set('details')" class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm" [class]="activeTab() === 'details' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' hover:text-primary' + ' hover:border-secondary'">
                    Details
                </button>
                <button (click)="activeTab.set('history')" class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm" [class]="activeTab() === 'history' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' hover:text-primary' + ' hover:border-secondary'">
                    Activity History ({{relatedActivitiesAndTasks().length}})
                </button>
                <button (click)="activeTab.set('files')" class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm" [class]="activeTab() === 'files' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' hover:text-primary' + ' hover:border-secondary'">
                    Files ({{allFiles().length}})
                </button>
            </nav>
        </div>
      }

      <form #oppForm="ngForm" (ngSubmit)="saveOpportunity(oppForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
          @if (isNew || activeTab() === 'details') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Opportunity Name</label>
                <input type="text" name="name" [ngModel]="opportunityModel()?.name" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Company</label>
                <select name="companyId" [ngModel]="opportunityModel()?.companyId" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
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
                <select name="stage" [ngModel]="opportunityModel()?.stage" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
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
                <select name="ownerId" [ngModel]="opportunityModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>
           </div>

           <!-- AI Assistant & Notes Section -->
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
                
                <div class="mt-6 pt-6 border-t" [class]="themeService.c('border-primary')">
                    <h3 class="text-lg font-semibold mb-4" [class]="themeService.c('text-primary')">Notes & Details</h3>
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Analysis Details</label>
                        <textarea name="analysisDetails" [ngModel]="opportunityModel()?.analysisDetails" rows="4" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')"></textarea>
                      </div>
                      <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Value Proposition</label>
                        <textarea name="proposalDetails" [ngModel]="opportunityModel()?.proposalDetails" rows="4" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')"></textarea>
                      </div>
                      <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Negotiation Details</label>
                        <textarea name="negotiationDetails" [ngModel]="opportunityModel()?.negotiationDetails" rows="4" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')"></textarea>
                      </div>
                    </div>
                </div>
            }
          } @else if(activeTab() === 'history') {
             <div class="flow-root">
              <ul role="list" class="-mb-8">
                @for (item of relatedActivitiesAndTasks(); track item.id; let isLast = $last) {
                  <li>
                    <div class="relative pb-8">
                      @if(!isLast) {
                        <span class="absolute top-4 left-4 -ml-px h-full w-0.5" [class]="themeService.c('bg-secondary')" aria-hidden="true"></span>
                      }
                      <div class="relative flex space-x-3 cursor-pointer" (click)="openHistoryItem(item)">
                        <div>
                          <span class="h-8 w-8 rounded-full flex items-center justify-center ring-8" [class]="getIconBgColor(item.itemType === 'task' ? 'task' : item.type) + ' ' + themeService.c('bg-primary', true) + ' ring-opacity-100'">
                            <svg class="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" [innerHTML]="getIconPath(item.itemType === 'task' ? 'task' : item.type)"></svg>
                          </span>
                        </div>
                        <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p class="text-sm" [class]="themeService.c('text-secondary')">
                              <span class="font-medium" [class]="themeService.c('text-primary')">{{ item.itemType === 'task' ? item.title : item.subject }}</span>
                              by {{ dataService.getUserById(item.ownerId)?.name }}
                            </p>
                            @if (item.itemType === 'activity') {
                              <p class="text-sm mt-1" [class]="themeService.c('text-base')">{{ item.description }}</p>
                            }
                          </div>
                          <div class="text-right text-sm whitespace-nowrap" [class]="themeService.c('text-secondary')">
                            <time [dateTime]="item.date">{{ item.date | date:'short' }}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                } @empty {
                  <div class="text-center py-12">
                     <p [class]="themeService.c('text-secondary')">No activities or tasks logged for this opportunity yet.</p>
                  </div>
                }
              </ul>
            </div>
          } @else if(activeTab() === 'files') {
            <div class="space-y-4">
                <!-- File Upload -->
                <div>
                    <label for="file-upload" class="relative cursor-pointer w-full flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md" [class]="themeService.c('border-secondary') + ' ' + themeService.c('hover:border-accent')">
                        <div class="space-y-1 text-center">
                            <svg class="mx-auto h-12 w-12" [class]="themeService.c('text-tertiary')" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            <div class="flex text-sm"><p class="pl-1" [class]="themeService.c('text-secondary')">Drop files here or <span class="font-medium" [class]="themeService.c('text-accent')">click to upload</span></p></div>
                            <p class="text-xs" [class]="themeService.c('text-tertiary')">PNG, JPG, PDF, DOCX etc.</p>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="onFileSelected($event)">
                    </label>
                </div>
                <!-- File List -->
                <ul class="divide-y" [class]="themeService.c('border-primary')">
                    @for(file of allFiles(); track file.id) {
                        <li class="py-3 flex items-center justify-between">
                            <div class="flex items-center space-x-3 min-w-0">
                                <div class="w-8 h-8 flex-shrink-0" [innerHTML]="getIconPathForFile(file.name, file.type)"></div>
                                <div class="min-w-0">
                                    <p class="font-medium text-sm truncate" [class]="themeService.c('text-primary')">{{ file.name }}</p>
                                    <p class="text-xs" [class]="themeService.c('text-secondary')">{{ formatBytes(file.size) }} - {{ file.uploadedAt | date:'short' }}</p>
                                </div>
                            </div>
                            <div>
                                @if (file.isFromQuote) {
                                    <button type="button" (click)="openQuotePreview(file.quoteId)" class="font-medium text-sm p-2 rounded-md" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover') + ' ' + themeService.c('hover:bg-accent-subtle')">Preview</button>
                                } @else {
                                    <a [href]="file.url" target="_blank" class="font-medium text-sm p-2 rounded-md" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover') + ' ' + themeService.c('hover:bg-accent-subtle')">Download</a>
                                }
                            </div>
                        </li>
                    } @empty {
                        <li class="text-center py-8" [class]="themeService.c('text-secondary')">No files or quotes attached.</li>
                    }
                </ul>
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
  private sanitizer = inject(DomSanitizer);

  isNew = false;
  opportunityModel = signal<Partial<Opportunity>>({});
  aiSuggestion = signal<string | null>(null);
  activeTab = signal<'details' | 'history' | 'files'>('details');
  
  opportunityStages = Object.values(OpportunityStage);

  relatedActivities = computed(() => {
    const oppId = this.opportunityModel()?.id;
    if (!oppId) return [];
    return this.dataService.activities().filter(a => a.relatedEntity?.type === 'opportunity' && a.relatedEntity.id === oppId);
  });

  relatedActivitiesAndTasks = computed(() => {
    const oppId = this.opportunityModel()?.id;
    if (!oppId) return [];

    const activities = this.dataService.activities()
      .filter(a => a.relatedEntity?.type === 'opportunity' && a.relatedEntity.id === oppId)
      .map(a => ({ ...a, itemType: 'activity' as const, date: a.startTime }));

    const tasks = this.dataService.tasks()
      .filter(t => t.relatedEntity?.type === 'opportunity' && t.relatedEntity.id === oppId)
      .map(t => ({ ...t, itemType: 'task' as const, date: t.createdAt, subject: t.title }));

    const combined = [...activities, ...tasks];
    
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  relatedQuotes = computed<Quote[]>(() => {
    const oppId = this.opportunityModel()?.id;
    if (!oppId) return [];
    return this.dataService.quotes().filter(q => q.opportunityId === oppId);
  });

  allFiles = computed<DisplayFile[]>(() => {
    const attachments = this.opportunityModel()?.attachments ?? [];
    const quoteFiles: DisplayFile[] = this.relatedQuotes().map(quote => ({
      id: `quote-${quote.id}`,
      name: `Quote #${quote.quoteNumber}.pdf`,
      url: '#',
      type: 'Quote' as const,
      uploadedAt: quote.createdAt,
      size: 123456, // Mock size
      isFromQuote: true,
      quoteId: quote.id
    }));

    const all = [...attachments, ...quoteFiles];
    all.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return all;
  });

  constructor() {
    effect(() => {
      const selectedOpportunity = this.uiService.selectedOpportunity();
      untracked(() => {
        if (selectedOpportunity === undefined) return;

        if (selectedOpportunity === null) {
          this.isNew = true;
          this.activeTab.set('details');
          this.opportunityModel.set({ 
              ownerId: this.authService.currentUser()?.id,
              stage: OpportunityStage.Prospecting,
              attachments: [],
              closeDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // Default to 1 month
          });
        } else {
          this.isNew = false;
          this.activeTab.set('details');
          this.opportunityModel.set({ ...selectedOpportunity, attachments: selectedOpportunity.attachments ? [...selectedOpportunity.attachments] : [] });
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const newAttachment: FileAttachment = {
        id: `file-${Date.now()}`,
        name: file.name,
        url: '#', // Mock URL
        type: 'Other', // default type
        uploadedAt: new Date().toISOString(),
        size: file.size,
      };
      
      const currentAttachments = this.opportunityModel().attachments || [];
      this.opportunityModel.update(opp => ({
        ...opp,
        attachments: [...currentAttachments, newAttachment]
      }));
      // Reset file input
      input.value = '';
    }
  }
  
  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  openHistoryItem(item: (Activity & { itemType: 'activity' }) | (Task & { itemType: 'task' })) {
    this.uiService.isModalReadonly.set(true);
    if (item.itemType === 'activity') {
      this.uiService.openActivityEditModal(item as Activity);
    } else if (item.itemType === 'task') {
      this.uiService.openTaskModal(item as Task);
    }
  }

  openQuotePreview(quoteId: string | undefined) {
    if (!quoteId) return;
    const quote = this.dataService.quotes().find(q => q.id === quoteId);
    if (quote) {
        this.uiService.openQuotePreview(quote);
    }
  }

  getIconBgColor(type: string): string {
    const colors: { [key: string]: string } = { 'task': 'bg-cyan-500', 'Call summary': 'bg-amber-500', 'Email': 'bg-sky-500', 'Meeting': 'bg-violet-500', 'Note': 'bg-slate-500' };
    return colors[type] || 'bg-slate-500';
  }

  getIconPath(type: string): SafeHtml {
    const icons: { [key: string]: string } = {
        'task': `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />`,
        'Call summary': `<path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />`,
        'Email': `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25-2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />`,
        'Meeting': `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493m-4.83 2.493a9.337 9.337 0 004.121.952A9.38 9.38 0 0015 19.128M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.106 5.106A7.5 7.5 0 0112 3.375c1.621 0 2.922.784 3.665 1.954C16.299 6.544 16.68 7.708 16.68 8.875c0 1.25-.401 2.414-1.003 3.438C15.048 13.513 13.632 14.25 12 14.25c-1.632 0-3.048-.737-3.665-1.937C7.701 11.289 7.32 10.125 7.32 8.875c0-1.167.393-2.331 1.003-3.438C8.952 4.159 10.368 3.375 12 3.375z" />`,
        'Note': `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />`,
    };
    const svgContent = icons[type] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }
  
  getIconPathForFile(fileName: string, fileType?: FileAttachment['type']): SafeHtml {
    if (fileType === 'Quote') {
        const path = `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full ${this.themeService.c('text-special')}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`;
        return this.sanitizer.bypassSecurityTrustHtml(path);
    }
    const ext = fileName.split('.').pop()?.toLowerCase();
    let path = `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full ${this.themeService.c('text-secondary')}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`; // Default
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext ?? '')) {
      path = `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full ${this.themeService.c('text-info')}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
    } else if (ext === 'pdf') {
      path = `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full ${this.themeService.c('text-danger')}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(path);
  }
}
