import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Company, Opportunity, Contact } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { GeminiService } from '../../../services/gemini.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-company-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeCompanyDetails()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-800 z-50 flex flex-col">
      <header class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Company' : 'Company Details' }}</h2>
        <button (click)="uiService.closeCompanyDetails()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-6">
        <form #companyForm="ngForm" (ngSubmit)="saveCompany(companyForm)">
          <div class="flex items-start space-x-6">
            <div class="relative">
              @if(geminiService.isGeneratingLogo()) {
                <div class="w-24 h-24 rounded-md bg-gray-700 flex items-center justify-center animate-pulse">
                  <svg class="w-10 h-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.217-.266.498-.5.796-.7L21 5.25M11.42 15.17l-4.653 4.653a2.652 2.652 0 01-3.75 0L3 17.25a2.652 2.652 0 010-3.75l4.653-4.653M3 17.25l2.496-3.03c.217-.266.498-.5.796-.7L12 5.25" /></svg>
                </div>
              } @else {
                <img class="w-24 h-24 rounded-md object-cover bg-gray-700" [src]="companyModel().logoUrl || 'https://placehold.co/96x96/374151/9ca3af/png?text=Logo'" alt="Company logo">
              }
              <button type="button" (click)="generateLogo(companyForm)" [disabled]="!companyForm.value.name || geminiService.isGeneratingLogo()" class="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-full text-white shadow-md hover:bg-indigo-700 disabled:bg-gray-500" title="Generate logo with AI">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" /></svg>
              </button>
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300">Company Name</label>
                <input type="text" name="name" [(ngModel)]="companyModel().name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Industry</label>
                <input type="text" name="industry" [(ngModel)]="companyModel().industry" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Website</label>
                <input type="text" name="website" [(ngModel)]="companyModel().website" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-gray-700">
            <h3 class="text-lg font-medium text-gray-200">Address Information</h3>
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Address</label>
                <input type="text" name="addressLine1" [(ngModel)]="companyModel().addressLine1" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">City</label>
                <input type="text" name="city" [(ngModel)]="companyModel().city" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">State / Province</label>
                <input type="text" name="state" [(ngModel)]="companyModel().state" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Postal Code</label>
                <input type="text" name="postalCode" [(ngModel)]="companyModel().postalCode" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
            </div>
          </div>


          <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
            @if(!isNew) {
              <button type="button" (click)="deleteCompany()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium mr-auto">Delete</button>
            }
            <button type="button" (click)="uiService.closeCompanyDetails()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
            <button type="submit" [disabled]="companyForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Company</button>
          </div>
        </form>

        @if(!isNew) {
          <div class="mt-8">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Related Contacts ({{ relatedContacts().length }})</h3>
            <div class="bg-gray-900 rounded-md border border-gray-700">
              @for(contact of relatedContacts(); track contact.id) {
                <div class="p-3 border-b border-gray-700 last:border-b-0 flex justify-between items-center">
                  <div>
                    <p class="font-medium text-gray-100">{{ contact.name }}</p>
                    <p class="text-sm text-gray-400">{{ contact.email }}</p>
                  </div>
                  <button (click)="uiService.openContactModal(contact)" class="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View</button>
                </div>
              } @empty {
                <p class="p-4 text-center text-sm text-gray-500">No contacts found for this company.</p>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  geminiService = inject(GeminiService);
  authService = inject(AuthService);

  isNew = false;
  companyModel = signal<Partial<Company>>({});

  relatedContacts = computed(() => {
    const companyId = this.companyModel()?.id;
    if (!companyId) return [];
    return this.dataService.contacts().filter(c => c.companyId === companyId);
  });

  constructor() {
    effect(() => {
      const selectedCompany = this.uiService.selectedCompany();
      untracked(() => {
        if (selectedCompany === undefined) return;
        if (selectedCompany === null) {
          this.isNew = true;
          this.companyModel.set({});
        } else {
          this.isNew = false;
          this.companyModel.set({ ...selectedCompany });
        }
      });
    });
  }

  async generateLogo(form: NgForm) {
    if (!form.value.name || !form.value.industry) {
      alert('Please provide a company name and industry to generate a logo.');
      return;
    }
    const prompt = {
      companyName: form.value.name,
      industry: form.value.industry,
    };
    const logoUrl = await this.geminiService.generateLogo(prompt);
    if (logoUrl) {
      this.companyModel.update(c => ({...c, logoUrl}));
    }
  }

  async saveCompany(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.companyModel(), ...form.value };

    if (this.isNew) {
      const newCompany: Company = {
        ...formData,
        id: `comp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ownerId: this.authService.currentUser()!.id,
      } as Company;
      await this.dataService.addCompany(newCompany);
    } else {
      await this.dataService.updateCompany(formData as Company);
    }
    this.uiService.closeCompanyDetails();
  }
  
  async deleteCompany() {
    const companyId = this.companyModel().id;
    if (!companyId) return;

    const contacts = this.dataService.contacts().filter(c => c.companyId === companyId);
    if (contacts.length > 0) {
        alert(`Cannot delete company. It has ${contacts.length} associated contact(s). Please reassign or delete them first.`);
        return;
    }

    if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
        await this.dataService.deleteCompany(companyId);
        this.uiService.closeCompanyDetails();
    }
  }
}