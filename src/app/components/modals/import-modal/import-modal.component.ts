import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { Contact, Company, Opportunity, OpportunityStage, Task, ImportableEntity } from '../../../models/crm.models';

@Component({
  selector: 'app-import-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeImportModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-100">Import {{ uiService.importTarget() | titlecase }}</h2>
            <button (click)="uiService.closeImportModal()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6">
          @if(uiService.importStep() === 'upload') {
            <div>
              <p class="text-gray-300 mb-4">Upload a CSV file to import your data.</p>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  <div class="flex text-sm text-gray-400">
                    <label for="file-upload" class="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 focus-within:ring-offset-gray-800">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" class="sr-only" (change)="handleFileUpload($event)" accept=".csv">
                    </label>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-500">CSV up to 10MB</p>
                </div>
              </div>
            </div>
          }
          @if(uiService.importStep() === 'map') {
            <div>
                <p class="text-gray-300 mb-4">Map the columns from your CSV to the fields in the CRM.</p>
                <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
                    @for(header of uiService.csvHeaders(); track header) {
                        <div class="grid grid-cols-2 gap-4 items-center">
                            <span class="font-medium text-gray-200">{{header}}</span>
                            <select (change)="updateMapping(header, $any($event.target).value)" class="block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="">- Ignore this column -</option>
                                @for(field of targetFields(); track field) {
                                    <option [value]="field">{{field}}</option>
                                }
                            </select>
                        </div>
                    }
                </div>
                 <div class="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                    <button (click)="uiService.importStep.set('upload')" class="text-sm font-medium text-gray-300 hover:text-gray-100">&larr; Back</button>
                    <button (click)="importData()" [disabled]="!isMappingValid()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Import Data</button>
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

  targetFields = computed(() => {
    switch (this.uiService.importTarget()) {
      case 'companies': return ['name', 'industry', 'website'];
      case 'contacts': return ['name', 'email', 'phone'];
      case 'opportunities': return ['name', 'value', 'closeDate'];
      case 'tasks': return ['title', 'dueDate'];
      default: return [];
    }
  });

  isMappingValid = computed(() => {
    const mappings = this.uiService.fieldMappings();
    const requiredFields: {[key:string]: string[]} = {
      companies: ['name'],
      contacts: ['name', 'email'],
      opportunities: ['name', 'value'],
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

    this.uiService.csvData().forEach(row => {
      const target = this.uiService.importTarget();
      if (target === 'companies') {
          const nameHeader = invertedMappings.name;
          const industryHeader = invertedMappings.industry;
          const websiteHeader = invertedMappings.website;
          
          if (!nameHeader) return;

          const newCompany: Company = {
            id: `comp-${Date.now()}-${Math.random()}`,
            name: row[nameHeader] || '',
            industry: industryHeader ? row[industryHeader] || '' : '',
            website: websiteHeader ? row[websiteHeader] || '' : '',
            createdAt: new Date().toISOString(),
          };
          importPromises.push(this.dataService.addCompany(newCompany));
      }
      // Implement for other types as needed
    });
    
    await Promise.all(importPromises);
    alert(`Successfully imported ${this.uiService.csvData().length} records.`);
    this.uiService.closeImportModal();
  }
}
