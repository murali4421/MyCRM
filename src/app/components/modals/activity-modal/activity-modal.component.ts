
// FIX: Completed the implementation of ActivityModalComponent, which was previously missing/truncated, to resolve the export error.
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Activity } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-activity-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="closeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
          <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ title() }}</h2>
          <button (click)="closeModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
            <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div class="p-6 overflow-y-auto">
          <form #activityForm="ngForm" (ngSubmit)="saveActivity(activityForm)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Type</label>
                <select name="type" [ngModel]="activityModel()?.type" required [disabled]="isReadonly()" class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                  <option>Call summary</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>Note</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Subject</label>
                <input type="text" name="subject" [ngModel]="activityModel()?.subject" required [disabled]="isReadonly()" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>

              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Description / Notes</label>
                <div class="relative">
                  <textarea name="description" [ngModel]="activityModel()?.description" #descriptionField="ngModel" (ngModelChange)="rawTextForSummary.set($event)" rows="5" required [readonly]="isReadonly()" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')"></textarea>
                  @if (!isReadonly()) {
                    <button type="button" (click)="generateSummary(descriptionField.value)" [disabled]="geminiService.isGeneratingSummary() || !descriptionField.value" class="absolute bottom-2 right-2 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap" [class]="themeService.c('bg-accent-subtle') + ' ' + themeService.c('text-accent-subtle') + ' ' + themeService.c('hover:bg-accent-subtle-hover')">
                      @if (geminiService.isGeneratingSummary()) {
                        <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" [class]="themeService.c('border-accent')"></div>
                      } @else {
                        <span>✨ Summarize</span>
                      }
                    </button>
                  }
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Date & Time</label>
                <input type="datetime-local" name="startTime" [ngModel]="activityModel()?.startTime" required [disabled]="isReadonly()" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Owner</label>
                <select name="ownerId" [ngModel]="activityModel()?.ownerId" required [disabled]="isReadonly()" class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Related To</label>
                <div class="mt-1 flex gap-2">
                    <select name="relatedEntityType" [ngModel]="activityModel().relatedEntity?.type ?? 'none'" (ngModelChange)="onEntityTypeChange(activityForm, $event)" [disabled]="isReadonly()" class="block w-1/3 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                        <option value="none">-- None --</option>
                        <option value="contact">Contact</option>
                        <option value="company">Company</option>
                        <option value="opportunity">Opportunity</option>
                    </select>
                    @if (relatedEntityType() !== 'none') {
                        <select name="relatedEntityId" [ngModel]="activityModel().relatedEntity?.id" [disabled]="isReadonly()" class="block w-2/3 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                            <option [ngValue]="undefined" disabled>Select {{ relatedEntityType() }}</option>
                            @switch (relatedEntityType()) {
                                @case ('contact') {
                                    @for(contact of dataService.contacts(); track contact.id) { <option [value]="contact.id">{{ contact.name }}</option> }
                                }
                                @case ('company') {
                                    @for(company of dataService.companies(); track company.id) { <option [value]="company.id">{{ company.name }}</option> }
                                }
                                @case ('opportunity') {
                                    @for(opp of dataService.opportunities(); track opp.id) { <option [value]="opp.id">{{ opp.name }}</option> }
                                }
                            }
                        </select>
                    }
                </div>
              </div>

            </div>
            <div class="mt-8 pt-4 border-t flex justify-end gap-2" [class]="themeService.c('border-primary')">
              @if (isReadonly()) {
                <button type="button" (click)="closeModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Close</button>
              } @else {
                <button type="button" (click)="closeModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="activityForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Activity</button>
              }
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  geminiService = inject(GeminiService);
  themeService = inject(ThemeService);

  isAutoGenerated = input<boolean>(false);
  isNew = false;
  activityModel = signal<Partial<Activity>>({});
  rawTextForSummary = signal('');
  relatedEntityType = signal<'contact' | 'company' | 'opportunity' | 'none'>('none');
  isReadonly = computed(() => this.uiService.isModalReadonly());

  title = computed(() => {
    if (this.isReadonly()) return 'Activity Details';
    if (this.isAutoGenerated()) return 'Confirm AI Generated Activity';
    return this.isNew ? 'Log Activity' : 'Edit Activity';
  });

  constructor() {
    effect(() => {
      let model: Partial<Activity> = {};
      if (this.isAutoGenerated()) {
        const autoActivity = this.uiService.autoGeneratedActivity();
        if (autoActivity) {
          this.isNew = true;
          model = {
            ...autoActivity,
            ownerId: this.authService.currentUser()?.id,
            startTime: new Date().toISOString().slice(0, 16),
            status: 'Done'
          };
        }
      } else {
        const editingActivity = this.uiService.editingActivity();
        if (editingActivity) {
          this.isNew = false;
          const localDateTime = new Date(editingActivity.startTime).toISOString().slice(0, 16);
          model = { ...editingActivity, startTime: localDateTime };
        } else {
          this.isNew = true;
          model = {
            ownerId: this.authService.currentUser()?.id,
            startTime: new Date().toISOString().slice(0, 16),
            status: 'Done',
            type: 'Call summary'
          };
        }
      }

      untracked(() => {
        this.activityModel.set(model);
        this.relatedEntityType.set(model.relatedEntity?.type ?? 'none');
      });
    });
  }

  closeModal() {
    if (this.isAutoGenerated()) {
      this.uiService.autoGeneratedActivity.set(null);
    } else {
      this.uiService.closeActivityEditModal();
    }
  }
  
  async generateSummary(textToSummarize: string) {
    if (!textToSummarize) return;
    const result = await this.geminiService.generateActivitySummary(textToSummarize);
    if (result) {
      this.activityModel.update(model => ({
        ...model,
        subject: result.subject,
        description: result.description
      }));
    }
  }

  onEntityTypeChange(form: NgForm, newType: 'contact' | 'company' | 'opportunity' | 'none') {
    this.relatedEntityType.set(newType);
    this.activityModel.update(model => ({ ...model, relatedEntity: undefined }));
    if (form.controls['relatedEntityId']) {
      form.controls['relatedEntityId'].reset();
    }
  }

  async saveActivity(form: NgForm) {
    if (form.invalid || this.isReadonly()) return;
    
    const { relatedEntityType, relatedEntityId, ...activityFormValues } = form.value;
    const finalActivityData = { ...this.activityModel(), ...activityFormValues };

    if (relatedEntityType !== 'none' && relatedEntityId) {
        finalActivityData.relatedEntity = { type: relatedEntityType, id: relatedEntityId };
    } else {
        finalActivityData.relatedEntity = undefined;
    }
    
    const activityData = {
        ...finalActivityData,
        startTime: new Date(form.value.startTime).toISOString(),
        endTime: new Date(form.value.startTime).toISOString()
    }

    if (this.isNew) {
      const newActivity: Activity = {
        ...activityData,
        id: `act-${Date.now()}`,
      } as Activity;
      await this.dataService.addActivity(newActivity);
    } else {
      await this.dataService.updateActivity(activityData as Activity);
    }
    this.closeModal();
  }
}
