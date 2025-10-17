import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  template: `
     <header class="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 sm:px-6">
        <!-- Hamburger Menu for mobile -->
        <button (click)="uiService.isSidebarOpen.set(true)" class="lg:hidden text-gray-400 hover:text-gray-200">
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        
        <!-- Spacer to push other items to the right on desktop -->
        <div class="hidden lg:block"></div>

        <div class="flex items-center space-x-1 sm:space-x-4">
            <button class="p-2 rounded-full hover:bg-gray-700 text-gray-400">
                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.95V4a1 1 0 10-2 0v1.05A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <div class="relative">
                <button (click)="uiService.isProfileMenuOpen.set(!uiService.isProfileMenuOpen())" class="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-200">
                    {{ authService.currentUser()?.name.charAt(0) }}
                </button>
                @if(uiService.isProfileMenuOpen()) {
                    <div class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                        <div class="px-4 py-2 text-sm text-gray-200 border-b border-gray-700">
                            <p class="font-semibold">{{authService.currentUser()?.name}}</p>
                            <p class="text-gray-400 truncate">{{authService.currentUser()?.email}}</p>
                        </div>
                        <a href="#" (click)="$event.preventDefault(); uiService.openProfileModal()" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Profile</a>
                        <a href="#" (click)="$event.preventDefault(); authService.logout()" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Logout</a>
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
}