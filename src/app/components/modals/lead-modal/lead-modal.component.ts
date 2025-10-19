
import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Lead, LeadStatus } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-lead-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeLeadModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Lead' : 'Edit Lead' }}</h2>
            <button (click)="uiService.closeLeadModal()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <form #leadForm="ngForm" (ngSubmit)="saveLead(leadForm)">
            <div class="p-6">
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Full Name</label>
                            <input type="text" name="name" [ngModel]="leadModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Company Name</label>
                            <input type="text" name="companyName" [ngModel]="leadModel()?.companyName" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                        </div>
                    </div>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Email</label>
                            <input type="email" name="email" [ngModel]="leadModel()?.email" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Phone</label>
                            <input type="text" name="phone" [ngModel]="leadModel()?.phone" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                        </div>
                    </div>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Status</label>
                            <select name="status" [ngModel]="leadModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                                @for(status of leadStatuses; track status) {
                                    <option [value]="status">{{status}}</option>
                                }
                            </select>
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-gray-300">Lead Source</label>
                            <select name="sourceSelection" [(ngModel)]="sourceSelection" required class="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                                @for(source of predefinedSources; track source) {
                                    <option [value]="source">{{source}}</option>
                                }
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    @if (sourceSelection() === 'Other') {
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Custom Source</label>
                            <input type="text" name="customSource" [(ngModel)]="customSource" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                        </div>
                    }
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Owner</label>
                        <select name="ownerId" [ngModel]="leadModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                             @for(user of dataService.users(); track user.id) {
                                <option [value]="user.id">{{user.name}}</option>
                            }
                        </select>
                    </div>
                </div>
            </div>
            <footer class="px-6 pb-6 pt-4 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeLeadModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="leadForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Lead</button>
                 @if(!isNew) {
                    <button type="button" (click)="deleteLead()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium">Delete</button>
                }
            </footer>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  isNew = false;
  leadModel = signal<Partial<Lead>>({});
  leadStatuses = Object.values(LeadStatus);
  predefinedSources = ['Website', 'Referral', 'Cold Outreach', 'Trade Show', 'Advertisement'];
  
  sourceSelection = signal('');
  customSource = signal('');

  constructor() {
    effect(() => {
        const selectedLead = this.uiService.selectedLead();
        untracked(() => {
            if (selectedLead === undefined) return;

            if (selectedLead === null) {
                this.isNew = true;
                const defaultSource = this.predefinedSources[0];
                this.leadModel.set({ 
                    ownerId: this.authService.currentUser()?.id,
                    status: LeadStatus.New,
                    source: defaultSource
                });
                this.sourceSelection.set(defaultSource);
                this.customSource.set('');
            } else {
                this.isNew = false;
                this.leadModel.set({ ...selectedLead });
                if (this.predefinedSources.includes(selectedLead.source)) {
                    this.sourceSelection.set(selectedLead.source);
                    this.customSource.set('');
                } else {
                    this.sourceSelection.set('Other');
                    this.customSource.set(selectedLead.source);
                }
            }
        });
    });
  }
  
  async saveLead(form: NgForm) {
    if (form.invalid) return;

    const finalSource = this.sourceSelection() === 'Other' ? this.customSource() : this.sourceSelection();
    
    const leadDataFromForm = form.value;
    delete leadDataFromForm.sourceSelection;
    delete leadDataFromForm.customSource;

    const formData = { 
        ...this.leadModel(), 
        ...leadDataFromForm,
        source: finalSource
    };

    if (this.isNew) {
      const newLead: Lead = {
        ...formData,
        id: `lead-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Lead;
      await this.dataService.addLead(newLead);
    } else {
      await this.dataService.updateLead(formData as Lead);
    }
    this.uiService.closeLeadModal();
  }
  
  async deleteLead() {
    const leadId = this.leadModel()?.id;
    if(leadId && confirm('Are you sure you want to delete this lead?')) {
        await this.dataService.deleteLead(leadId);
        this.uiService.closeLeadModal();
    }
  }
}
