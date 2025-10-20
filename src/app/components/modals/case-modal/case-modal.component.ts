import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Case, CaseStatus, CasePriority } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-case-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeCaseModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-2xl" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Case' : 'Edit Case' }}</h2>
            <button (click)="uiService.closeCaseModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <form #caseForm="ngForm" (ngSubmit)="saveCase(caseForm)">
            <div class="p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Subject</label>
                        <input type="text" name="subject" [ngModel]="caseModel()?.subject" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Contact</label>
                            <select name="contactId" [ngModel]="caseModel()?.contactId" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')" (ngModelChange)="onContactChange($event)">
                                <option [ngValue]="undefined" disabled>Select Contact</option>
                                @for(contact of dataService.contacts(); track contact.id) {
                                    <option [value]="contact.id">{{contact.name}}</option>
                                }
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Company</label>
                            <input type="text" [ngModel]="companyName()" name="companyName" readonly class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-base') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('border-primary')">
                        </div>
                    </div>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Status</label>
                            <select name="status" [ngModel]="caseModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                                @for(status of caseStatuses; track status) { <option [value]="status">{{status}}</option> }
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Priority</label>
                            <select name="priority" [ngModel]="caseModel()?.priority" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                                @for(p of casePriorities; track p) { <option [value]="p">{{p}}</option> }
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Description</label>
                        <textarea name="description" [ngModel]="caseModel()?.description" rows="4" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Owner</label>
                        <select name="ownerId" [ngModel]="caseModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                             @for(user of dataService.users(); track user.id) { <option [value]="user.id">{{user.name}}</option> }
                        </select>
                    </div>
                </div>
            </div>
            <footer class="px-6 pb-6 pt-4 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeCaseModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="caseForm.invalid" class="px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled') + ' ' + themeService.c('text-on-accent')">Save Case</button>
                @if(!isNew) {
                    <button type="button" (click)="deleteCase()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-danger-subtle') + ' ' + themeService.c('border-danger-subtle') + ' ' + themeService.c('text-danger') + ' ' + themeService.c('hover:bg-danger-subtle-hover')">Delete</button>
                }
            </footer>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isNew = false;
  caseModel = signal<Partial<Case>>({});
  caseStatuses = Object.values(CaseStatus);
  casePriorities = Object.values(CasePriority);
  
  constructor() {
    effect(() => {
        const selectedCase = this.uiService.selectedCase();
        untracked(() => {
            if (selectedCase === undefined) return;
            if (selectedCase === null) {
                this.isNew = true;
                this.caseModel.set({ 
                    ownerId: this.authService.currentUser()?.id,
                    status: CaseStatus.New,
                    priority: CasePriority.Medium
                });
            } else {
                this.isNew = false;
                this.caseModel.set({ ...selectedCase });
            }
        });
    });
  }

  companyName = computed(() => {
      const contactId = this.caseModel()?.contactId;
      if (!contactId) return 'Select a contact';
      const contact = this.dataService.contacts().find(c => c.id === contactId);
      if (!contact) return 'Contact not found';
      const company = this.dataService.getCompanyById(contact.companyId);
      return company?.name || 'Company not found';
  });

  onContactChange(contactId: string) {
      const contact = this.dataService.contacts().find(c => c.id === contactId);
      if (contact) {
          this.caseModel.update(m => ({ ...m, contactId: contactId, companyId: contact.companyId }));
      }
  }
  
  async saveCase(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.caseModel(), ...form.value };

    if (this.isNew) {
      const newCase: Case = {
        ...formData,
        id: `case-${Date.now()}`,
        caseNumber: `CS${Math.floor(10000 + Math.random() * 90000)}`,
        createdAt: new Date().toISOString(),
      } as Case;
      await this.dataService.addCase(newCase);
    } else {
      await this.dataService.updateCase(formData as Case);
    }
    this.uiService.closeCaseModal();
  }
  
  async deleteCase() {
    const caseId = this.caseModel()?.id;
    if(caseId && confirm('Are you sure you want to delete this case?')) {
        await this.dataService.deleteCase(caseId);
        this.uiService.closeCaseModal();
    }
  }
}