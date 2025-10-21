

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { Contact, Company, Opportunity, OpportunityStage, Task, ImportableEntity } from '../../../models/crm.models';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-import-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeImportModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-2xl" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Import {{ uiService.importTarget() | titlecase }}</h2>
            <button (click)="uiService.closeImportModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6">
          @if(uiService.importStep() === 'upload') {
            <div>
              <p class="mb-4" [class]="themeService.c('text-base')">Upload a CSV file to import your data.</p>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md" [class]="themeService.c('border-secondary')">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12" [class]="themeService.c('text-tertiary')" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  <div class="flex text-sm" [class]="themeService.c('text-secondary')">
                    <label for="file-upload" class="relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2" [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-accent') + ' hover:text-accent-hover' + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:ring-offset-primary')">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="handleFileUpload($event)" accept=".csv">
                    </label>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs" [class]="themeService.c('text-tertiary')">CSV up to 10MB</p>
                </div>
              </div>
            </div>
          }
          @if(uiService.importStep() === 'map') {
            <div>
                <p class="mb-4" [class]="themeService.c('text-base')">Map the columns from your CSV to the fields in Cortex CRM.</p>
                <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
                    @for(header of uiService.csvHeaders(); track header) {
                        <div class="grid grid-cols-2 gap-4 items-center">
                            <span class="font-medium" [class]="themeService.c('text-primary')">{{header}}</span>
                            <select (change)="updateMapping(header, $any($event.target).value)" class="block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                                <option value="">- Ignore this column -</option>
                                @for(field of targetFields(); track field) {
                                    <option [value]="field">{{field}}</option>
                                }
                            </select>
                        </div>
                    }
                </div>
                 <div class="mt-6 pt-4 border-t flex justify-between items-center" [class]="themeService.c('border-primary')">
                    <button (click)="uiService.importStep.set('upload')" class="text-sm font-medium" [class]="themeService.c('text-base') + ' ' + themeService.c('hover:text-primary')">&larr; Back</button>
                    <button (click)="importData()" [disabled]="!isMappingValid()" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Import Data</button>
                </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportModalComponent {
  uiService = inject(UiService);
  dataService = inject(DataService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  targetFields = computed(() => {
    switch (this.uiService.importTarget()) {
      case 'companies': return ['name', 'industry', 'website'];
      case 'contacts': return ['name', 'email', 'phone', 'companyName'];
      case 'opportunities': return ['name', 'companyName', 'value', 'closeDate'];
      case 'tasks': return ['title', 'dueDate'];
      default: return [];
    }
  });

  isMappingValid = computed(() => {
    const mappings = this.uiService.fieldMappings();
    const requiredFields: {[key:string]: string[]} = {
      companies: ['name'],
      contacts: ['name', 'email', 'companyName'],
      opportunities: ['name', 'companyName', 'value'],
      tasks: ['title']
    };
    const target = this.uiService.importTarget();
    if (!target) return false;

    return requiredFields[target].every(field => Object.values(mappings).includes(field));
  });

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = reader.result as string;
        this.parseCsv(text);
      };
      reader.readAsText(file);
    }
  }

  parseCsv(text: string) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return headers.reduce<{[key:string]:string}>((obj, header, index) => {
        obj[header] = values[index] || '';
        return obj;
      }, {});
    });

    this.uiService.csvHeaders.set(headers);
    this.uiService.csvData.set(data);
    this.uiService.importStep.set('map');
  }

  updateMapping(header: string, field: string) {
    this.uiService.fieldMappings.update(current => ({ ...current, [header]: field }));
  }

  async importData() {
    if (!this.isMappingValid()) return;

    const mappings = this.uiService.fieldMappings();
    const invertedMappings: Record<string, string> = {};
    for (const csvHeader of Object.keys(mappings)) {
      const crmField = mappings[csvHeader];
      if (crmField) {
        invertedMappings[crmField] = csvHeader;
      }
    }

    const importPromises: Promise<any>[] = [];
    const errors: string[] = [];
    const currentUser = this.authService.currentUser();
    const target = this.uiService.importTarget();

    if (!currentUser) {
        alert('Cannot import: user not logged in.');
        return;
    }

    const dataToImport = this.uiService.csvData();
    const importCount = dataToImport.length;

    if (target === 'companies') {
        const limit = this.authService.limitFor('company')();
        if (limit !== -1) {
            const currentCount = this.authService.tenantCompanyCount();
            if (currentCount >= limit) {
                this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} companies. You cannot import more.`);
                return;
            }
            if (currentCount + importCount > limit) {
                this.uiService.openUpgradeModal(`Importing ${importCount} companies would exceed your plan's limit of ${limit}. You can add ${limit - currentCount} more.`);
                return;
            }
        }
    }

    if (target === 'contacts') {
        const limit = this.authService.limitFor('contact')();
        if (limit !== -1) {
            const currentCount = this.authService.tenantContactCount();
            if (currentCount >= limit) {
                this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} contacts. You cannot import more.`);
                return;
            }
            if (currentCount + importCount > limit) {
                this.uiService.openUpgradeModal(`Importing ${importCount} contacts would exceed your plan's limit of ${limit}. You can add ${limit - currentCount} more.`);
                return;
            }
        }
    }
    
    if (target === 'opportunities') {
        const limit = this.authService.limitFor('opportunity')();
        if (limit !== -1) {
            const currentCount = this.authService.tenantOpportunityCount();
            if (currentCount >= limit) {
                this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} opportunities. You cannot import more.`);
                return;
            }
            if (currentCount + importCount > limit) {
                this.uiService.openUpgradeModal(`Importing ${importCount} opportunities would exceed your plan's limit of ${limit}. You can add ${limit - currentCount} more.`);
                return;
            }
        }
    }

    this.uiService.csvData().forEach((row, index) => {
      switch (target) {
        case 'companies': {
            const nameHeader = invertedMappings.name;
            const industryHeader = invertedMappings.industry;
            const websiteHeader = invertedMappings.website;
            
            if (!nameHeader || !row[nameHeader]) {
                errors.push(`Row ${index + 2}: Missing company name. Skipping.`);
                return;
            }

            const newCompany: Company = {
                id: `comp-import-${Date.now()}-${index}`,
                name: row[nameHeader],
                industry: industryHeader ? row[industryHeader] : '',
                website: websiteHeader ? row[websiteHeader] : '',
                createdAt: new Date().toISOString(),
                ownerId: currentUser.id,
            };
            importPromises.push(this.dataService.addCompany(newCompany));
            break;
        }
        case 'contacts': {
            const nameHeader = invertedMappings.name;
            const emailHeader = invertedMappings.email;
            const phoneHeader = invertedMappings.phone;
            const companyNameHeader = invertedMappings.companyName;

            if (!nameHeader || !row[nameHeader] || !emailHeader || !row[emailHeader] || !companyNameHeader || !row[companyNameHeader]) {
                errors.push(`Row ${index + 2}: Missing required data (name, email, or companyName). Skipping.`);
                return;
            }
            
            const companyName = row[companyNameHeader];
            const company = this.dataService.companies().find(c => c.name.toLowerCase() === companyName.toLowerCase());

            if (!company) {
                errors.push(`Row ${index + 2}: Company "${companyName}" not found. Skipping.`);
                return;
            }

            const newContact: Contact = {
                id: `cont-import-${Date.now()}-${index}`,
                name: row[nameHeader],
                email: row[emailHeader],
                phone: phoneHeader ? row[phoneHeader] : '',
                companyId: company.id,
                ownerId: currentUser.id, // Default to current user
                createdAt: new Date().toISOString()
            };
            importPromises.push(this.dataService.addContact(newContact));
            break;
        }
        case 'opportunities': {
          const nameHeader = invertedMappings.name;
          const companyNameHeader = invertedMappings.companyName;
          const valueHeader = invertedMappings.value;
          const closeDateHeader = invertedMappings.closeDate;

          if (!nameHeader || !row[nameHeader] || !companyNameHeader || !row[companyNameHeader] || !valueHeader || !row[valueHeader]) {
              errors.push(`Row ${index + 2}: Missing required data (name, companyName, or value). Skipping.`);
              return;
          }

          const companyName = row[companyNameHeader];
          const company = this.dataService.companies().find(c => c.name.toLowerCase() === companyName.toLowerCase());

          if (!company) {
              errors.push(`Row ${index + 2}: Company "${companyName}" not found. Skipping.`);
              return;
          }

          const newOpp: Opportunity = {
              id: `opp-import-${Date.now()}-${index}`,
              name: row[nameHeader],
              companyId: company.id,
              stage: OpportunityStage.Prospecting,
              value: parseFloat(row[valueHeader]),
              closeDate: closeDateHeader && row[closeDateHeader] ? new Date(row[closeDateHeader]).toISOString().split('T')[0] : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
              ownerId: currentUser.id,
              createdAt: new Date().toISOString()
          };
          importPromises.push(this.dataService.addOpportunity(newOpp));
          break;
        }
        case 'tasks': {
          const titleHeader = invertedMappings.title;
          const dueDateHeader = invertedMappings.dueDate;

          if (!titleHeader || !row[titleHeader]) {
              errors.push(`Row ${index + 2}: Missing task title. Skipping.`);
              return;
          }

          const newTask: Task = {
              id: `task-import-${Date.now()}-${index}`,
              title: row[titleHeader],
              dueDate: dueDateHeader && row[dueDateHeader] ? new Date(row[dueDateHeader]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              ownerId: currentUser.id,
              completed: false,
              createdAt: new Date().toISOString(),
          };
          importPromises.push(this.dataService.addTask(newTask));
          break;
        }
      }
    });
    
    await Promise.all(importPromises);
    
    const successCount = importPromises.length;
    let message = `Successfully imported ${successCount} record(s).`;
    if (errors.length > 0) {
      message += `\n\nCould not import ${errors.length} record(s):\n${errors.slice(0, 5).join('\n')}`;
       if (errors.length > 5) {
        message += `\n...and ${errors.length - 5} more errors.`;
      }
    }
    alert(message);

    if (successCount > 0) {
        this.uiService.closeImportModal();
    }
  }
}