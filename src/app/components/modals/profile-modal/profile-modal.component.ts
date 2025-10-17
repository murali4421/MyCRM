import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UiService } from '../../../services/ui.service';

@Component({
  selector: 'app-profile-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeProfileModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-800 z-50 flex flex-col">
      <header class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-100">Profile Settings</h2>
        <button (click)="uiService.closeProfileModal()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>
      <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
        <!-- Sidebar -->
        <aside class="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-gray-700 p-2 md:p-4">
          <nav class="flex flex-row md:flex-col md:space-y-1 -mx-2 md:mx-0 px-2 md:px-0 overflow-x-auto">
            <button (click)="uiService.profileView.set('personal-info')" [class]="uiService.profileView() === 'personal-info' ? 'bg-gray-700 text-gray-50' : 'text-gray-300 hover:bg-gray-700'" class="px-3 py-2 text-sm font-medium rounded-md text-left whitespace-nowrap md:whitespace-normal">Personal info</button>
            <button (click)="uiService.profileView.set('password')" [class]="uiService.profileView() === 'password' ? 'bg-gray-700 text-gray-50' : 'text-gray-300 hover:bg-gray-700'" class="px-3 py-2 text-sm font-medium rounded-md text-left whitespace-nowrap md:whitespace-normal">Password</button>
            <button (click)="uiService.profileView.set('notifications')" [class]="uiService.profileView() === 'notifications' ? 'bg-gray-700 text-gray-50' : 'text-gray-300 hover:bg-gray-700'" class="px-3 py-2 text-sm font-medium rounded-md text-left whitespace-nowrap md:whitespace-normal">Notifications</button>
          </nav>
        </aside>
        <!-- Content -->
        <main class="flex-1 p-4 md:p-6 overflow-y-auto">
          @switch(uiService.profileView()) {
            @case('personal-info') {
              <div>
                <h3 class="text-lg font-semibold mb-4 text-gray-100">Personal Information</h3>
                <form #profileForm="ngForm" class="space-y-4">
                   <div class="flex items-center space-x-4">
                      <img class="h-20 w-20 rounded-full" [src]="authService.currentUser()?.profilePictureUrl" alt="Profile picture">
                      <div>
                        <button type="button" class="px-3 py-1.5 text-sm border border-gray-600 rounded-md hover:bg-gray-700 text-gray-200">Change</button>
                        <p class="text-xs text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                      </div>
                    </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Full Name</label>
                    <input type="text" name="name" [ngModel]="authService.currentUser()?.name" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Job Title</label>
                    <input type="text" name="jobTitle" [ngModel]="authService.currentUser()?.jobTitle" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" name="email" [ngModel]="authService.currentUser()?.email" class="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-sm" readonly>
                  </div>
                  <div class="pt-4">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Save changes</button>
                  </div>
                </form>
              </div>
            }
            @case('password') {
              <div>
                <h3 class="text-lg font-semibold mb-4 text-gray-100">Change Password</h3>
                <form #passwordForm="ngForm" class="space-y-4 max-w-md">
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Current Password</label>
                    <input type="password" name="currentPassword" ngModel required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                   <div>
                    <label class="block text-sm font-medium text-gray-300">New Password</label>
                    <input type="password" name="newPassword" ngModel required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Confirm New Password</label>
                    <input type="password" name="confirmPassword" ngModel required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <div class="pt-4">
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Update Password</button>
                  </div>
                </form>
              </div>
            }
            @case('notifications') {
               <div>
                <h3 class="text-lg font-semibold mb-4 text-gray-100">Notification Settings</h3>
                <div class="space-y-4">
                  <div class="flex items-start">
                      <div class="flex items-center h-5">
                          <input id="comments" name="comments" type="checkbox" [(ngModel)]="emailNotifications" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded">
                      </div>
                      <div class="ml-3 text-sm">
                          <label for="comments" class="font-medium text-gray-200">Email Notifications</label>
                          <p class="text-gray-400">Get emails about new tasks, mentions, and other updates.</p>
                      </div>
                  </div>
                  <div class="flex items-start">
                      <div class="flex items-center h-5">
                          <input id="push" name="push" type="checkbox" [(ngModel)]="pushNotifications" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded">
                      </div>
                      <div class="ml-3 text-sm">
                          <label for="push" class="font-medium text-gray-200">Push Notifications</label>
                          <p class="text-gray-400">Get push notifications on your desktop or mobile device.</p>
                      </div>
                  </div>
                </div>
                <div class="mt-8 pt-4 border-t border-gray-700 flex items-center gap-4">
                  <button (click)="saveNotificationSettings()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-600" [disabled]="savedStatus() === 'saving'">
                    @if (savedStatus() === 'saving') {
                      <span>Saving...</span>
                    } @else {
                      <span>Save Settings</span>
                    }
                  </button>
                  @if (savedStatus() === 'saved') {
                    <span class="text-sm font-medium text-emerald-400">Settings saved!</span>
                  }
                </div>
              </div>
            }
          }
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileModalComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);

  emailNotifications = signal(true);
  pushNotifications = signal(false);
  savedStatus = signal<'idle' | 'saving' | 'saved'>('idle');

  saveNotificationSettings() {
    this.savedStatus.set('saving');
    // Simulate API call
    setTimeout(() => {
      console.log('Saved notification settings:', {
        email: this.emailNotifications(),
        push: this.pushNotifications(),
      });
      this.savedStatus.set('saved');
      setTimeout(() => this.savedStatus.set('idle'), 2000);
    }, 1000);
  }
}
