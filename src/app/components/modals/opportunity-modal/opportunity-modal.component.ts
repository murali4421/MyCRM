import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Opportunity, OpportunityStage, Contact } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-opportunity-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeOpportunityModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-xl bg-gray-800 z-50 flex flex-col">
      <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Opportunity' : 'Opportunity Details' }}</h2>
        <button (click)="uiService.closeOpportunityModal()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <form #oppForm="ngForm" (ngSubmit)="saveOpportunity(oppForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Opportunity Name</label>
                <input type="text" name="name" [ngModel]="opportunityModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300">Company</label>
                <select name="companyId" [ngModel]="opportunityModel()?.companyId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="" disabled>Select a company</option>
                    @for(company of dataService.companies(); track company.id) {
                        <option [value]="company.id">{{company.name}}</option>
                    }
                </select>
              </div>

                <div>
                <label class="block text-sm font-medium text-gray-300">Stage</label>
                <select name="stage" [ngModel]="opportunityModel()?.stage" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    @for(stage of opportunityStages; track stage) {
                        <option [value]="stage">{{stage}}</option>
                    }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300">Value (USD)</label>
                <input type="number" name="value" [ngModel]="opportunityModel()?.value" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300">Close Date</label>
                <input type="date" name="closeDate" [ngModel]="opportunityModel()?.closeDate" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>

                <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Owner</label>
                <select name="ownerId" [ngModel]="opportunityModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>
            </div>

            @if(!isNew && opportunityContacts().length > 0) {
              <div class="mt-6 pt-6 border-t border-gray-700">
                  <h3 class="text-lg font-semibold text-gray-100 mb-4">Related Contacts</h3>
                  <ul class="space-y-3">
                      @for(contact of opportunityContacts(); track contact.id) {
                          <li class="flex justify-between items-center bg-gray-900 p-3 rounded-md">
                              <div>
                                  <p class="font-medium text-gray-100">{{ contact.name }}</p>
                                  <p class="text-sm text-gray-400">{{ contact.email }}</p>
                              </div>
                              <button type="button" (click)="openComposer(contact)" class="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center space-x-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span>Email</span>
                              </button>
                          </li>
                      }
                  </ul>
              </div>
            }
        </div>
        <footer class="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 flex-shrink-0">
          <button type="button" (click)="uiService.closeOpportunityModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
          <button type="submit" [disabled]="oppForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Opportunity</button>
            @if(!isNew) {
            <button type="button" (click)="deleteOpportunity()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium">Delete</button>
            }
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

  isNew = false;
  opportunityModel = signal<Partial<Opportunity>>({});
  opportunityStages = Object.values(OpportunityStage);

  opportunityContacts = computed(() => {
    const companyId = this.opportunityModel()?.companyId;
    if (!companyId) return [];
    return this.dataService.contacts().filter(c => c.companyId === companyId);
  });

  constructor() {
    effect(() => {
        const selectedOpportunity = this.uiService.selectedOpportunity();
        untracked(() => {
            if (selectedOpportunity) {
                this.isNew = false;
                this.opportunityModel.set({ ...selectedOpportunity });
            } else {
                this.isNew = true;
                this.opportunityModel.set({ 
                    ownerId: this.authService.currentUser()?.id,
                    stage: OpportunityStage.Prospecting,
                    closeDate: new Date().toISOString().split('T')[0]
                });
            }
        });
    });
  }
  
  openComposer(contact: Contact) {
    this.uiService.openEmailComposer({
      to: contact.email,
      subject: `Re: ${this.opportunityModel().name}`,
      body: '',
      relatedEntity: { type: 'opportunity', id: this.opportunityModel().id! }
    });
  }

  saveOpportunity(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.opportunityModel(), ...form.value };

    if (this.isNew) {
      const newOpp: Opportunity = {
        ...formData,
        id: `opp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.dataService.addOpportunity(newOpp);
    } else {
      this.dataService.updateOpportunity(formData as Opportunity);
    }
    this.uiService.closeOpportunityModal();
  }
  
  deleteOpportunity() {
    if(this.opportunityModel()?.id && confirm('Are you sure you want to delete this opportunity?')) {
        this.dataService.deleteOpportunity(this.opportunityModel().id!);
        this.uiService.closeOpportunityModal();
    }
  }
}