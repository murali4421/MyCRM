
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';

@Component({
  selector: 'app-lead-conversion-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeLeadConversionModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-100">Convert Lead: {{ lead()?.name }}</h2>
          <button (click)="uiService.closeLeadConversionModal()" class="p-2 rounded-full hover:bg-gray-700">
            <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <form #convertForm="ngForm" (ngSubmit)="convertLead(convertForm)">
          <div class="p-6">
            <p class="text-gray-300 mb-4">This will create a new contact and company. You can also create a new opportunity.</p>
            
            <div class="space-y-4">
              <div class="bg-gray-700/50 p-3 rounded-md">
                <p class="text-sm font-medium text-gray-400">New Contact</p>
                <p class="text-gray-100">{{ lead()?.name }}</p>
              </div>
              <div class="bg-gray-700/50 p-3 rounded-md">
                <p class="text-sm font-medium text-gray-400">New Company</p>
                <p class="text-gray-100">{{ lead()?.companyName }}</p>
              </div>
              
              <div class="flex items-center">
                <input id="createOpp" type="checkbox" [(ngModel)]="createOpportunity" name="createOpportunity" class="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500">
                <label for="createOpp" class="ml-2 block text-sm text-gray-200">Create a new opportunity for this contact</label>
              </div>
              
              @if(createOpportunity) {
                <div class="space-y-4 pt-4 border-t border-gray-700">
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Opportunity Name</label>
                    <input type="text" name="oppName" ngModel required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                  </div>
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Opportunity Value (USD)</label>
                    <input type="number" name="oppValue" ngModel required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                  </div>
                </div>
              }
            </div>
          </div>
          <footer class="px-6 pb-6 pt-4 flex justify-end gap-2">
            <button type="button" (click)="uiService.closeLeadConversionModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
            <button type="submit" [disabled]="convertForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Convert Lead</button>
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
  
  lead = this.uiService.leadToConvert;
  createOpportunity = false;
  isConverting = signal(false);

  async convertLead(form: NgForm) {
    if (form.invalid || !this.lead()) return;
    
    this.isConverting.set(true);
    try {
      await this.dataService.convertLead(
        this.lead()!.id, 
        this.createOpportunity, 
        this.createOpportunity ? { name: form.value.oppName, value: form.value.oppValue } : undefined
      );
      this.uiService.closeLeadConversionModal();
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Lead conversion failed. Please check the console for details.");
    } finally {
      this.isConverting.set(false);
    }
  }
}
