import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Company, Opportunity, Contact } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { GeminiService } from '../../../services/gemini.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-company-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeCompanyDetails()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-2xl z-50 flex flex-col" [class]="themeService.c('bg-primary')">
      <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
        <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Company' : 'Company Details' }}</h2>
        <button (click)="uiService.closeCompanyDetails()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
           <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto">
        <div class="p-6">
          <form #companyForm="ngForm" (ngSubmit)="saveCompany(companyForm)" class="space-y-4">
            <div class="flex items-start space-x-4">
              <div class="relative">
                @if (companyModel()?.logoUrl) {
                  <img class="h-20 w-20 rounded-md object-cover" [src]="companyModel()?.logoUrl" alt="Company logo">
                } @else {
                  <div class="h-20 w-20 rounded-md flex items-center justify-center" [class]="themeService.c('bg-secondary')">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" [class]="themeService.c('text-tertiary')" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m6 4v-4m6 4v-4m-9 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h2.5" /></svg>
                  </div>
                }
                 @if(geminiService.isGeneratingLogo()) {
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                        <div class="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                 }
              </div>

              <div class="flex-1">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Company Name</label>
                <input type="text" name="name" [ngModel]="companyModel()?.name" #name="ngModel" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                <button type="button" (click)="generateLogo(name.value)" [disabled]="!name.value || geminiService.isGeneratingLogo()" class="mt-2 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50" [class]="themeService.c('bg-accent-subtle') + ' ' + themeService.c('text-accent-subtle') + ' ' + themeService.c('hover:bg-accent-subtle-hover')">
                  ✨ Generate Logo with AI
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Industry</label>
              <input type="text" name="industry" [ngModel]="companyModel()?.industry" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
            </div>

            <div>
              <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Website</label>
              <input type="text" name="website" [ngModel]="companyModel()?.website" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
            </div>

            <div class="pt-4 mt-4 border-t" [class]="themeService.c('border-primary')">
                <h3 class="text-lg font-medium leading-6" [class]="themeService.c('text-primary')">Address</h3>
                <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Address Line 1</label>
                        <input type="text" name="addressLine1" [ngModel]="companyModel()?.addressLine1" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">City</label>
                        <input type="text" name="city" [ngModel]="companyModel()?.city" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">State / Province</label>
                        <input type="text" name="state" [ngModel]="companyModel()?.state" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Postal Code</label>
                        <input type="text" name="postalCode" [ngModel]="companyModel()?.postalCode" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-6 pt-4 border-t" [class]="themeService.c('border-primary')">
                <button type="button" (click)="uiService.closeCompanyDetails()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="companyForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Company</button>
                 @if(!isNew) {
                  <button type="button" (click)="deleteCompany()" class="px-4 py-2 rounded-md text-sm font-medium border" [class]="themeService.c('bg-danger-subtle') + ' ' + themeService.c('border-danger-subtle') + ' ' + themeService.c('text-danger') + ' ' + themeService.c('hover:bg-danger-subtle-hover')">Delete</button>
                 }
            </div>
          </form>

          @if(!isNew) {
            <div class="mt-8">
              <div class="border-b" [class]="themeService.c('border-primary')">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                  <button (click)="activeTab.set('contacts')" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm" [class]="activeTab() === 'contacts' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' ' + themeService.c('hover:text-primary') + ' ' + themeService.c('hover:border-secondary')">Contacts ({{ relatedContacts().length }})</button>
                  <button (click)="activeTab.set('opportunities')" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm" [class]="activeTab() === 'opportunities' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' ' + themeService.c('hover:text-primary') + ' ' + themeService.c('hover:border-secondary')">Opportunities ({{ relatedOpportunities().length }})</button>
                </nav>
              </div>

              <div class="mt-6">
                @switch (activeTab()) {
                  @case ('contacts') {
                    <ul class="divide-y" [class]="themeService.c('border-primary')">
                      @for(contact of relatedContacts(); track contact.id) {
                        <li class="py-3">
                          <p class="font-medium" [class]="themeService.c('text-primary')">{{ contact.name }}</p>
                          <p class="text-sm" [class]="themeService.c('text-secondary')">{{ contact.email }}</p>
                        </li>
                      }
                      @empty { <p class="py-4 text-center" [class]="themeService.c('text-secondary')">No contacts for this company.</p> }
                    </ul>
                  }
                  @case ('opportunities') {
                    <ul class="divide-y" [class]="themeService.c('border-primary')">
                      @for(opp of relatedOpportunities(); track opp.id) {
                        <li class="py-3">
                          <p class="font-medium" [class]="themeService.c('text-primary')">{{ opp.name }}</p>
                          <p class="text-sm" [class]="themeService.c('text-secondary')">{{ opp.value | currency }} - {{ opp.stage }}</p>
                        </li>
                      }
                      @empty { <p class="py-4 text-center" [class]="themeService.c('text-secondary')">No opportunities for this company.</p> }
                    </ul>
                  }
                }
              </div>
            </div>
          }
        </div>
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
  themeService = inject(ThemeService);

  isNew = false;
  companyModel = signal<Partial<Company>>({});
  activeTab = signal<'contacts' | 'opportunities'>('contacts');

  relatedContacts = computed<Contact[]>(() => {
    const companyId = this.companyModel()?.id;
    if (!companyId) return [];
    return this.dataService.contacts().filter(c => c.companyId === companyId);
  });

  relatedOpportunities = computed<Opportunity[]>(() => {
    const companyId = this.companyModel()?.id;
    if (!companyId) return [];
    return this.dataService.opportunities().filter(o => o.companyId === companyId);
  });

  constructor() {
    effect(() => {
      const selectedCompany = this.uiService.selectedCompany();
      untracked(() => {
        if (selectedCompany === undefined) return;
        if (selectedCompany === null) {
          this.isNew = true;
          this.companyModel.set({ ownerId: this.authService.currentUser()?.id });
        } else {
          this.isNew = false;
          this.companyModel.set({ ...selectedCompany });
          this.activeTab.set('contacts');
        }
      });
    });
  }

  async generateLogo(companyName: string) {
    const industry = this.companyModel().industry || 'business';
    if (!companyName) return;

    const base64Image = await this.geminiService.generateLogo({ companyName, industry });
    if (base64Image) {
      this.companyModel.update(c => ({...c, logoUrl: base64Image}));
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
      } as Company;
      await this.dataService.addCompany(newCompany);
    } else {
      await this.dataService.updateCompany(formData as Company);
    }
    this.uiService.closeCompanyDetails();
  }

  async deleteCompany() {
    const companyId = this.companyModel()?.id;
    if (!companyId) return;
    
    if (this.relatedContacts().length > 0 || this.relatedOpportunities().length > 0) {
        alert('Cannot delete company with associated contacts or opportunities. Please reassign or delete them first.');
        return;
    }

    if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      await this.dataService.deleteCompany(companyId);
      this.uiService.closeCompanyDetails();
    }
  }
}