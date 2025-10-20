import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { Contact } from '../../../models/crm.models';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-contact-popover',
  imports: [CommonModule],
  template: `
    @if (popoverData(); as data) {
      <div 
        class="fixed z-50 w-64 border rounded-lg shadow-xl p-4 text-sm animate-fade-in-up"
        [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')"
        [style.top.px]="data.position.y"
        [style.left.px]="data.position.x"
      >
        @if (primaryContact()) {
          <div class="flex justify-between items-start">
            <h4 class="font-bold mb-2" [class]="themeService.c('text-primary')">Primary Contact</h4>
            <button (click)="uiService.closeContactPopover()" class="p-1 -mt-1 -mr-1 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-5 w-5" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="font-semibold" [class]="themeService.c('text-primary')">{{ primaryContact()?.name }}</p>
          <p [class]="themeService.c('text-secondary')">{{ primaryContact()?.roleInCompany }}</p>
          <div class="mt-3 pt-3 border-t space-y-2" [class]="themeService.c('border-primary')">
            <div>
              <p class="text-xs" [class]="themeService.c('text-tertiary')">Email</p>
              <a [href]="'mailto:' + primaryContact()?.email" class="hover:underline" [class]="themeService.c('text-accent')">{{ primaryContact()?.email }}</a>
            </div>
            <div>
              <p class="text-xs" [class]="themeService.c('text-tertiary')">Phone</p>
              <p [class]="themeService.c('text-base')">{{ primaryContact()?.phone }}</p>
            </div>
          </div>
        } @else {
           <div class="flex justify-between items-start">
            <h4 class="font-bold mb-2" [class]="themeService.c('text-primary')">No Contact Found</h4>
            <button (click)="uiService.closeContactPopover()" class="p-1 -mt-1 -mr-1 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-5 w-5" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p [class]="themeService.c('text-secondary')">There is no primary contact associated with this company.</p>
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
  themeService = inject(ThemeService);

  popoverData = this.uiService.contactPopoverData;
  
  primaryContact = computed<Contact | undefined>(() => {
    const companyId = this.popoverData()?.companyId;
    if (!companyId) return undefined;
    
    // Simple logic: return the first contact for the company.
    return this.dataService.contacts().find(c => c.companyId === companyId);
  });
}
