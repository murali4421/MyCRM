import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-upgrade-plan-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-40" (click)="uiService.closeUpgradeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-md border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-accent') + '/30'">
        <div class="p-6 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full" [class]="themeService.c('bg-accent-subtle')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" [class]="themeService.c('text-accent')" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </div>
            <h3 class="mt-4 text-xl font-bold" [class]="themeService.c('text-primary')">Upgrade Your Plan</h3>
            <p class="mt-2" [class]="themeService.c('text-secondary')">{{ uiService.isUpgradeModalOpen().reason }}</p>

            <div class="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                 <button (click)="activateAndClose()" class="w-full px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('text-on-accent')">
                    Activate Plan & Continue
                </button>
                <button (click)="uiService.closeUpgradeModal()" class="w-full border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">
                    Maybe Later
                </button>
            </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradePlanModalComponent {
  uiService = inject(UiService);
  dataService = inject(DataService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  activateAndClose() {
    const user = this.authService.currentUser();
    if (user) {
        this.dataService.activatePlanForCompany(user.companyId);
        this.uiService.closeUpgradeModal();
    }
  }
}