import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewService } from '../../services/view.service';
import { AppView } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../../components/shared/logo/logo.component';
import { ThemeService } from '../../services/theme.service';

interface NavItem {
  view: AppView;
  label: string;
  iconPath: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, LogoComponent],
  template: `
    <!-- Mobile sidebar -->
    @if (viewService.isSidebarOpen()) {
      <div class="lg:hidden fixed inset-0 flex z-40">
        <!-- Off-canvas menu -->
        <div class="fixed inset-0 bg-black/30" (click)="viewService.isSidebarOpen.set(false)"></div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full" [class]="themeService.c('bg-primary')">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button (click)="viewService.isSidebarOpen.set(false)" class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span class="sr-only">Close sidebar</span>
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div class="flex-shrink-0 flex items-center px-4 space-x-3">
              <app-logo sizeClass="w-8 h-8"></app-logo>
              <h1 class="text-xl font-bold" [class]="themeService.c('text-accent')">Cortex CRM</h1>
            </div>
            <nav class="mt-5 px-2 space-y-1">
              @for (item of visibleNavItems(); track item.view) {
                <a href="#" (click)="$event.preventDefault(); handleNavClick(item)"
                  [class]="isActive(item.view) ? themeService.c('bg-accent') + ' ' + themeService.c('text-on-accent') : themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')"
                  [class.opacity-50]="authService.isPlanExpired() && item.view !== 'dashboard'"
                  [class.pointer-events-none]="authService.isPlanExpired() && item.view !== 'dashboard'"
                  class="group flex items-center px-2 py-2 text-base font-medium rounded-md">
                  <svg class="mr-4 flex-shrink-0 h-6 w-6" [class]="isActive(item.view) ? themeService.c('text-on-accent') : themeService.c('text-tertiary') + ' group-hover:text-slate-300'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.iconPath" />
                  </svg>
                  {{ item.label }}
                </a>
              }
            </nav>
          </div>
        </div>
        <div class="flex-shrink-0 w-14"></div> <!-- Dummy element to force sidebar to shrink to fit close icon -->
      </div>
    }

    <!-- Desktop sidebar -->
    <div class="hidden lg:flex lg:flex-shrink-0">
      <div class="flex flex-col w-64">
        <div class="flex flex-col h-0 flex-1">
          <div class="flex items-center h-16 flex-shrink-0 px-4 space-x-3" [class]="themeService.c('bg-tertiary')">
            <app-logo sizeClass="w-8 h-8"></app-logo>
            <h1 class="text-xl font-bold" [class]="themeService.c('text-contrast')">Cortex CRM</h1>
          </div>
          <div class="flex-1 flex flex-col overflow-y-auto" [class]="themeService.c('bg-primary')">
            <nav class="flex-1 px-2 py-4 space-y-1">
              @for (item of visibleNavItems(); track item.view) {
                <a href="#" (click)="$event.preventDefault(); handleNavClick(item)"
                  [class]="isActive(item.view) ? themeService.c('bg-accent') + ' ' + themeService.c('text-on-accent') : themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')"
                  [class.opacity-50]="authService.isPlanExpired() && item.view !== 'dashboard'"
                  [class.pointer-events-none]="authService.isPlanExpired() && item.view !== 'dashboard'"
                  class="group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <svg class="mr-3 flex-shrink-0 h-6 w-6" [class]="isActive(item.view) ? themeService.c('text-on-accent') : themeService.c('text-tertiary') + ' group-hover:text-slate-300'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.iconPath" />
                  </svg>
                  {{ item.label }}
                </a>
              }
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  viewService = inject(ViewService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  private allNavItems: NavItem[] = [
    { view: 'dashboard', label: 'Dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { view: 'leads', label: 'Leads', iconPath: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.513-.96 1.487-1.594 2.522-1.594m-2.522 0A3 3 0 006 18.72m-3.741-.479A9.094 9.094 0 0112 15c-2.176 0-4.209.56-6 1.544'},
    { view: 'contacts', label: 'Contacts', iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { view: 'companies', label: 'Companies', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m6 4v-4m6 4v-4m-9 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h2.5' },
    { view: 'opportunities', label: 'Opportunities', iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { view: 'quotes', label: 'Quotes', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { view: 'cases', label: 'Support Cases', iconPath: 'M18.364 5.636l-1.414 1.414a9 9 0 11-12.728 0L2.93 5.636m16.852 9.899l-1.414-1.414M5.636 18.364l-1.414-1.414m12.728 0l1.414 1.414M12 18a6 6 0 100-12 6 6 0 000 12z' },
    { view: 'reports', label: 'Reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { view: 'projects', label: 'Projects', iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { view: 'products', label: 'Products & Services', iconPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V5c0-1.1.9-2 2-2z' },
    { view: 'tasks', label: 'Tasks', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { view: 'activities', label: 'Activities', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { view: 'users-roles', label: 'Users & Roles', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-6-6' },
    { view: 'email-templates', label: 'Email Templates', iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { view: 'audit-log', label: 'Audit Log', iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z' },
  ];

  visibleNavItems = computed(() => {
    return this.allNavItems.filter(item => this.authService.isViewAllowed(item.view));
  });

  isActive(view: AppView): boolean {
    return this.viewService.view() === view;
  }

  handleNavClick(item: NavItem) {
    if (!this.authService.isPlanExpired() || item.view === 'dashboard') {
      this.viewService.changeView(item.view);
    }
  }
}
