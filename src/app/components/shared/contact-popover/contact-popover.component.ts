import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { Contact } from '../../../models/crm.models';

@Component({
  selector: 'app-contact-popover',
  imports: [CommonModule],
  template: `
    @if (popoverData(); as data) {
      <div 
        class="fixed z-50 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 text-sm animate-fade-in-up"
        [style.top.px]="data.position.y"
        [style.left.px]="data.position.x"
      >
        @if (primaryContact()) {
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-gray-100 mb-2">Primary Contact</h4>
            <button (click)="uiService.closeContactPopover()" class="p-1 -mt-1 -mr-1 rounded-full hover:bg-gray-700">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="font-semibold text-gray-200">{{ primaryContact()?.name }}</p>
          <p class="text-gray-400">{{ primaryContact()?.roleInCompany }}</p>
          <div class="mt-3 pt-3 border-t border-gray-700 space-y-2">
            <div>
              <p class="text-xs text-gray-500">Email</p>
              <a [href]="'mailto:' + primaryContact()?.email" class="text-indigo-400 hover:underline">{{ primaryContact()?.email }}</a>
            </div>
            <div>
              <p class="text-xs text-gray-500">Phone</p>
              <p class="text-gray-300">{{ primaryContact()?.phone }}</p>
            </div>
          </div>
        } @else {
           <div class="flex justify-between items-start">
            <h4 class="font-bold text-gray-100 mb-2">No Contact Found</h4>
            <button (click)="uiService.closeContactPopover()" class="p-1 -mt-1 -mr-1 rounded-full hover:bg-gray-700">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-gray-400">There is no primary contact associated with this company.</p>
        }
      </div>
    }
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.2s ease-out forwards;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactPopoverComponent {
  uiService = inject(UiService);
  dataService = inject(DataService);

  popoverData = this.uiService.contactPopoverData;
  
  primaryContact = computed<Contact | undefined>(() => {
    const companyId = this.popoverData()?.companyId;
    if (!companyId) return undefined;
    
    // Simple logic: return the first contact for the company.
    return this.dataService.contacts().find(c => c.companyId === companyId);
  });
}
