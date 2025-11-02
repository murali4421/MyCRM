
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../../../services/data.service';
import { UiService } from '../../../../services/ui.service';
import { ThemeService } from '../../../../services/theme.service';
import { AuthService } from '../../../../services/auth.service';
import { ModalService } from '../../../../services/modal.service';

@Component({
  selector: 'app-lead-conversion-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="modalService.closeLeadConversionModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-lg" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
          <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Convert Lead: {{ lead()?.name }}</h2>
          <button (click)="modalService.closeLeadConversionModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
            <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form #convertForm="ngForm" (ngSubmit)="convertLead(convertForm)">
          <div class="p-6">
            <p class="mb-4" [class]="themeService.c('text-base')">This will create a new contact and company. You can also create a new opportunity.</p>
            
            <div class="space-y-4">
              <div class="p-3 rounded-md" [class]="themeService.c('bg-secondary') + '/50'">
                <p class="text-sm font-medium" [class]="themeService.c('text-secondary')">New Contact</p>
                <p [class]="themeService.c('text-primary')">{{ lead()?.name }}</p>
              </div>
              <div class="p-3 rounded-md" [class]="themeService.c('bg-secondary') + '/50'">
                <p class="text-sm font-medium" [class]="themeService.c('text-secondary')">New Company</p>
                <p [class]="themeService.c('text-primary')">{{ lead()?.companyName }}</p>
              </div>
              
              <div class="flex items-center">
                <input id="createOpp" type="checkbox" [(ngModel)]="createOpportunity" name="createOpportunity" class="h-4 w-4 rounded" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-accent') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent')">
                <label for="createOpp" class="ml-2 block text-sm" [class]="themeService.c('text-base')">Create a new opportunity for this contact</label>
              </div>
              
              @if(createOpportunity) {
                <div class="space-y-4 pt-4 border-t" [class]="themeService.c('border-primary')">
                   <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Opportunity Name</label>
                    <input type="text" name="oppName" ngModel required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                  </div>
                   <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Opportunity Value (USD)</label>
                    <input type="number" name="oppValue" ngModel required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                  </div>
                </div>
              }
            </div>
          </div>
          <footer class="px-6 pb-6 pt-4 flex justify-end gap-2">
            <button type="button" (click)="modalService.closeLeadConversionModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
            <button type="submit" [disabled]="convertForm.invalid" class="px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled') + ' ' + themeService.c('text-on-accent')">Convert Lead</button>
          </footer>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadConversionModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  modalService = inject(ModalService);
  
  lead = this.uiService.leadToConvert;
  createOpportunity = false;
  isConverting = signal(false);

  async convertLead(form: NgForm) {
    if (form.invalid || !this.lead()) return;

    const companyExists = this.dataService.companies().some(c => c.name.toLowerCase() === this.lead()!.companyName.toLowerCase());
    if (!companyExists && !this.authService.canAddCompany()) {
      const limit = this.authService.limitFor('company')();
      this.modalService.openUpgradeModal(`You have reached your plan's limit of ${limit} companies. Please upgrade to add more.`);
      return;
    }
    
    if (!this.authService.canAddContact()) {
      const limit = this.authService.limitFor('contact')();
      this.modalService.openUpgradeModal(`You have reached your plan's limit of ${limit} contacts. Please upgrade to add more.`);
      return;
    }

    if (this.createOpportunity && !this.authService.canAddOpportunity()) {
      const limit = this.authService.limitFor('opportunity')();
      this.modalService.openUpgradeModal(`You have reached your plan's limit of ${limit} opportunities. Please upgrade to add more.`);
      return;
    }
    
    this.isConverting.set(true);
    try {
      await this.dataService.convertLead(
        this.lead()!.id, 
        this.createOpportunity, 
        this.createOpportunity ? { name: form.value.oppName, value: form.value.oppValue } : undefined
      );
      this.modalService.closeLeadConversionModal();
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Lead conversion failed. Please check the console for details.");
    } finally {
      this.isConverting.set(false);
    }
  }
}
