import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationCenterComponent } from './notification-center.component';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, NotificationCenterComponent],
  template: `
     <header class="h-16 border-b flex items-center justify-between px-4 sm:px-6" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <!-- Hamburger Menu for mobile -->
        <button (click)="uiService.isSidebarOpen.set(true)" class="lg:hidden hover:text-slate-200" [class]="themeService.c('text-secondary')">
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        
        <!-- Spacer to push other items to the right on desktop -->
        <div class="hidden lg:block"></div>

        <div class="flex items-center space-x-1 sm:space-x-4">
            <!-- Notification Center -->
            <div class="relative">
                <button (click)="toggleNotificationCenter()" class="relative p-2 rounded-full" [class]="themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.95V4a1 1 0 10-2 0v1.05A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    @if (notificationService.unreadCount() > 0) {
                        <span class="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full ring-2" [class]="themeService.c('bg-accent') + ' ' + themeService.c('ring-base-for-notifications')"></span>
                    }
                </button>
                @if (uiService.isNotificationCenterOpen()) {
                    <app-notification-center />
                }
            </div>
            
            <!-- Profile Menu -->
            <div class="relative">
                <button (click)="toggleProfileMenu()" class="w-9 h-9 rounded-full flex items-center justify-center font-bold" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary')">
                    {{ authService.currentUser()?.name.charAt(0) }}
                </button>
                @if(uiService.isProfileMenuOpen()) {
                    <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
                        <div class="px-4 py-2 text-sm border-b" [class]="themeService.c('text-primary') + ' ' + themeService.c('border-primary')">
                            <p class="font-semibold">{{authService.currentUser()?.name}}</p>
                            <p class="truncate" [class]="themeService.c('text-secondary')">{{authService.currentUser()?.email}}</p>
                        </div>
                        <a href="#" (click)="$event.preventDefault(); uiService.openProfileModal()" class="block px-4 py-2 text-sm" [class]="themeService.c('text-primary') + ' ' + themeService.c('bg-primary-hover')">Profile</a>
                        <a href="#" (click)="$event.preventDefault(); authService.logout()" class="block px-4 py-2 text-sm" [class]="themeService.c('text-primary') + ' ' + themeService.c('bg-primary-hover')">Logout</a>
                    </div>
                }
            </div>
        </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);

  toggleProfileMenu() {
    this.uiService.isProfileMenuOpen.update(v => !v);
    if (this.uiService.isProfileMenuOpen()) {
        this.uiService.isNotificationCenterOpen.set(false);
    }
  }

  toggleNotificationCenter() {
    this.uiService.isNotificationCenterOpen.update(v => !v);
    if (this.uiService.isNotificationCenterOpen()) {
        this.uiService.isProfileMenuOpen.set(false);
    }
  }
}