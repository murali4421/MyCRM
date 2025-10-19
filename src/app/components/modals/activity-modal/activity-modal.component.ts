// FIX: Completed the implementation of ActivityModalComponent, which was previously missing/truncated, to resolve the export error.
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Activity } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-activity-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="closeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 class="text-xl font-semibold text-gray-100">{{ title() }}</h2>
          <button (click)="closeModal()" class="p-2 rounded-full hover:bg-gray-700">
            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div class="p-6 overflow-y-auto">
          <form #activityForm="ngForm" (ngSubmit)="saveActivity(activityForm)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300">Type</label>
                <select name="type" [ngModel]="activityModel()?.type" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option>Call summary</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>Note</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300">Subject</label>
                <input type="text" name="subject" [ngModel]="activityModel()?.subject" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300">Description / Notes</label>
                <div class="relative">
                  <textarea name="description" [ngModel]="activityModel()?.description" #descriptionField="ngModel" (ngModelChange)="rawTextForSummary.set($event)" rows="5" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"></textarea>
                  <button type="button" (click)="generateSummary(descriptionField.value)" [disabled]="geminiService.isGeneratingSummary() || !descriptionField.value" class="absolute bottom-2 right-2 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-500/20 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                    @if (geminiService.isGeneratingSummary()) {
                      <div class="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    } @else {
                      <span>✨ Summarize</span>
                    }
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300">Date & Time</label>
                <input type="datetime-local" name="startTime" [ngModel]="activityModel()?.startTime" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300">Owner</label>
                <select name="ownerId" [ngModel]="activityModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300">Related To</label>
                <div class="mt-1 flex gap-2">
                    <select name="relatedEntityType" [ngModel]="activityModel().relatedEntity?.type ?? 'none'" (ngModelChange)="onEntityTypeChange(activityForm, $event)" class="block w-1/3 pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="none">-- None --</option>
                        <option value="contact">Contact</option>
                        <option value="company">Company</option>
                        <option value="opportunity">Opportunity</option>
                    </select>
                    @if (relatedEntityType() !== 'none') {
                        <select name="relatedEntityId" [ngModel]="activityModel().relatedEntity?.id" class="block w-2/3 pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
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
            <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
              <button type="button" (click)="closeModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
              <button type="submit" [disabled]="activityForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Activity</button>
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

  isAutoGenerated = input<boolean>(false);
  isNew = false;
  activityModel = signal<Partial<Activity>>({});
  rawTextForSummary = signal('');
  relatedEntityType = signal<'contact' | 'company' | 'opportunity' | 'none'>('none');

  title = computed(() => {
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
    if (form.invalid) return;
    
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
