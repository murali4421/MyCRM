import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Company, Contact } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-company-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeCompanyDetails()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-800 z-50 flex flex-col">
       <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Company' : 'Company Details' }}</h2>
        <button (click)="uiService.closeCompanyDetails()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <form #companyForm="ngForm" (ngSubmit)="saveCompany(companyForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
            <div class="flex items-center space-x-4 mb-6">
              @if (logoUrl()) {
                <img [src]="logoUrl()" alt="Company logo" class="h-20 w-20 rounded-lg object-cover border border-gray-700">
              } @else {
                <div class="h-20 w-20 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m6 4v-4m6 4v-4m-9 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h2.5" /></svg>
                </div>
              }
              <div>
                <h3 class="text-lg font-semibold text-gray-100">{{ companyModel()?.name || 'New Company' }}</h3>
                <p class="text-sm text-gray-400">{{ companyModel()?.industry }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300">Company Name</label>
                <input type="text" name="name" [ngModel]="companyModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Industry</label>
                <input type="text" name="industry" [ngModel]="companyModel()?.industry" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Website</label>
                <input type="text" name="website" [ngModel]="companyModel()?.website" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
                <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Company Logo</label>
                <div class="flex items-center space-x-2 mt-1">
                    <input type="text" name="logoUrl" [(ngModel)]="logoUrl" placeholder="Enter image URL or generate one" class="block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <button type="button" (click)="generateLogo(companyForm)" [disabled]="geminiService.isGeneratingLogo() || !companyForm.value.name" class="bg-indigo-500/10 text-indigo-300 px-3 py-2 rounded-md hover:bg-indigo-500/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                      @if (geminiService.isGeneratingLogo()) {
                          <div class="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      } @else {
                          <span>✨ Generate</span>
                      }
                    </button>
                </div>
                </div>
            </div>

            @if(!isNew && companyContacts().length > 0) {
              <div class="mt-6 pt-6 border-t border-gray-700">
                  <h3 class="text-lg font-semibold text-gray-100 mb-4">Contacts at this Company</h3>
                  <ul class="space-y-3">
                      @for(contact of companyContacts(); track contact.id) {
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
            <button type="button" (click)="uiService.closeCompanyDetails()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
            <button type="submit" [disabled]="companyForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save</button>
              @if(!isNew) {
              <button type="button" (click)="deleteCompany()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium">Delete</button>
              }
        </footer>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  geminiService = inject(GeminiService);

  isNew = false;
  companyModel = signal<Partial<Company>>({});
  logoUrl = signal<string | undefined>('');

  companyContacts = computed(() => {
    const companyId = this.companyModel()?.id;
    if (!companyId) return [];
    return this.dataService.contacts().filter(c => c.companyId === companyId);
  });

  constructor() {
    effect(() => {
        const selectedCompany = this.uiService.selectedCompany();
        untracked(() => {
            if (selectedCompany) {
                this.isNew = false;
                this.companyModel.set({ ...selectedCompany });
                this.logoUrl.set(selectedCompany.logoUrl);
            } else {
                this.isNew = true;
                this.companyModel.set({});
                this.logoUrl.set('');
            }
        });
    });
  }

  async generateLogo(form: NgForm) {
    if (!form.value.name) return;
    const result = await this.geminiService.generateLogo({ companyName: form.value.name, industry: form.value.industry });
    if (result) {
      this.logoUrl.set(result);
    }
  }

  openComposer(contact: Contact) {
    this.uiService.openEmailComposer({
      to: contact.email,
      subject: '',
      body: '',
      relatedEntity: { type: 'company', id: this.companyModel().id! }
    });
  }

  saveCompany(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.companyModel(), ...form.value, logoUrl: this.logoUrl() };

    if (this.isNew) {
      const newCompany: Company = {
        ...formData,
        id: `comp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.dataService.addCompany(newCompany);
    } else {
      this.dataService.updateCompany(formData as Company);
    }
    this.uiService.closeCompanyDetails();
  }

  deleteCompany() {
    if(this.companyModel()?.id && confirm('Are you sure you want to delete this company?')) {
        this.dataService.deleteCompany(this.companyModel().id!);
        this.uiService.closeCompanyDetails();
    }
  }
}