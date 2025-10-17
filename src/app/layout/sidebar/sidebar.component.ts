import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { AppView } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

interface NavItem {
  view: AppView;
  label: string;
  iconPath: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  template: `
    <!-- Mobile sidebar -->
    @if (uiService.isSidebarOpen()) {
      <div class="lg:hidden fixed inset-0 flex z-40">
        <!-- Off-canvas menu -->
        <div class="fixed inset-0 bg-black/30" (click)="uiService.isSidebarOpen.set(false)"></div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button (click)="uiService.isSidebarOpen.set(false)" class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span class="sr-only">Close sidebar</span>
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div class="flex-shrink-0 flex items-center px-4 space-x-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-600"></div>
              <h1 class="text-xl font-bold text-white">CRM Pro</h1>
            </div>
            <nav class="mt-5 px-2 space-y-1">
              @for (item of visibleNavItems(); track item.view) {
                <a href="#" (click)="$event.preventDefault(); uiService.changeView(item.view)"
                  [class]="isActive(item.view) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
                  class="group flex items-center px-2 py-2 text-base font-medium rounded-md">
                  <svg class="mr-4 flex-shrink-0 h-6 w-6" [class]="isActive(item.view) ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-300'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
          <div class="flex items-center h-16 flex-shrink-0 px-4 bg-gray-950 space-x-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600"></div>
            <h1 class="text-xl font-bold text-white">CRM Pro</h1>
          </div>
          <div class="flex-1 flex flex-col overflow-y-auto bg-gray-900">
            <nav class="flex-1 px-2 py-4 space-y-1">
              @for (item of visibleNavItems(); track item.view) {
                <a href="#" (click)="$event.preventDefault(); uiService.changeView(item.view)"
                  [class]="isActive(item.view) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
                  class="group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  <svg class="mr-3 flex-shrink-0 h-6 w-6" [class]="isActive(item.view) ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-300'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
  uiService = inject(UiService);
  authService = inject(AuthService);
  dataService = inject(DataService);

  private allNavItems: NavItem[] = [
    { view: 'dashboard', label: 'Dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { view: 'companies', label: 'Companies', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m6 4v-4m6 4v-4m-9 4H7a2 2 0 01-2-2v-4a2 2 0 012-2h2.5' },
    { view: 'contacts', label: 'Contacts', iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { view: 'opportunities', label: 'Opportunities', iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { view: 'tasks', label: 'Tasks', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { view: 'activities', label: 'Activities', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { view: 'users-roles', label: 'Users & Roles', iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-6-6' },
    { view: 'email-templates', label: 'Email Templates', iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { view: 'audit-log', label: 'Audit Log', iconPath: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z' },
  ];

  private currentUserRoleName = computed(() => {
    const user = this.authService.currentUser();
    const roles = this.dataService.roles();
    if (!user || !user.roleId || !roles.length) {
        return null;
    }
    const role = roles.find(r => r.id === user.roleId);
    if (!role || !role.name) {
        return null;
    }
    return role.name;
  });

  visibleNavItems = computed(() => {
    const roleName = this.currentUserRoleName();
    const isManagerOrAdmin = roleName === 'Admin' || roleName === 'Manager';
    const isAdmin = roleName === 'Admin';

    return this.allNavItems.filter(item => {
      if (item.view === 'users-roles') {
        return isManagerOrAdmin;
      }
      if (item.view === 'audit-log') {
        return isAdmin;
      }
      return true;
    });
  });

  isActive(view: AppView): boolean {
    return this.uiService.view() === view;
  }
}