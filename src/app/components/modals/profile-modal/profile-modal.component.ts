import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { User } from '../../../models/crm.models';

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
                <form #profileForm="ngForm" (ngSubmit)="saveProfile(profileForm)" class="space-y-4">
                   <div class="flex items-center space-x-4">
                      <img class="h-20 w-20 rounded-full" [src]="authService.currentUser()?.profilePictureUrl" alt="Profile picture">
                      <div>
                        <button type="button" class="px-3 py-1.5 text-sm border border-gray-600 rounded-md hover:bg-gray-700 text-gray-200">Change</button>
                        <p class="text-xs text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                      </div>
                    </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Full Name</label>
                    <input type="text" name="name" [ngModel]="authService.currentUser()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Job Title</label>
                    <input type="text" name="jobTitle" [ngModel]="authService.currentUser()?.jobTitle" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" name="email" [ngModel]="authService.currentUser()?.email" class="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-sm" readonly>
                  </div>
                  <div class="pt-4 flex items-center gap-4">
                    <button type="submit" [disabled]="!profileForm.valid || profileSaveStatus() === 'saving'" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-600">
                      @if (profileSaveStatus() === 'saving') {
                        <span>Saving...</span>
                      } @else {
                        <span>Save changes</span>
                      }
                    </button>
                    @if (profileSaveStatus() === 'saved') {
                      <span class="text-sm font-medium text-emerald-400">Profile saved!</span>
                    }
                  </div>
                </form>
              </div>
            }
            @case('password') {
              <div>
                <h3 class="text-lg font-semibold mb-4 text-gray-100">Change Password</h3>
                <form #passwordForm="ngForm" (ngSubmit)="updatePassword(passwordForm)" class="space-y-4 max-w-md">
                   <div>
                    <label class="block text-sm font-medium text-gray-300">Current Password</label>
                    <input type="password" name="currentPassword" ngModel required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                   <div>
                    <label class="block text-sm font-medium text-gray-300">New Password</label>
                    <input type="password" name="newPassword" ngModel required minlength="8" #newPassword="ngModel" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                     @if (newPassword.invalid && newPassword.touched && newPassword.errors?.['minlength']) {
                        <p class="text-red-500 text-xs mt-1">Password must be at least 8 characters long.</p>
                     }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Confirm New Password</label>
                    <input type="password" name="confirmPassword" ngModel required #confirmPassword="ngModel" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                     @if (confirmPassword.touched && newPassword.value !== confirmPassword.value) {
                       <p class="text-red-500 text-xs mt-1">Passwords do not match.</p>
                     }
                  </div>
                  <div class="pt-4 flex flex-col items-start gap-4">
                    <button type="submit" [disabled]="!passwordForm.valid || (newPassword.value !== confirmPassword.value) || passwordUpdateStatus().status === 'updating'" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-600">
                       @if (passwordUpdateStatus().status === 'updating') {
                        <span>Updating...</span>
                      } @else {
                        <span>Update Password</span>
                      }
                    </button>
                    @if (passwordUpdateStatus().status === 'success') {
                       <p class="text-sm font-medium text-emerald-400">{{ passwordUpdateStatus().message }}</p>
                    }
                    @if (passwordUpdateStatus().status === 'error') {
                        <p class="text-sm font-medium text-red-400">{{ passwordUpdateStatus().message }}</p>
                    }
                  </div>
                </form>
              </div>
            }
            @case('notifications') {
              <div>
                <h3 class="text-lg font-semibold mb-4 text-gray-100">Notification Settings</h3>
                <div class="space-y-4">
                   <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-md">
                     <div>
                       <p class="font-medium text-gray-200">Email Notifications</p>
                       <p class="text-sm text-gray-400">Get emails to find out what's going on when you're not online.</p>
                     </div>
                     <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [(ngModel)]="notificationSettings().email" (ngModelChange)="updateEmailNotification($event)" class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                   </div>
                   <div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-md">
                     <div>
                       <p class="font-medium text-gray-200">Push Notifications</p>
                       <p class="text-sm text-gray-400">Get push notifications in-app to find out what's going on.</p>
                     </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" [(ngModel)]="notificationSettings().push" (ngModelChange)="updatePushNotification($event)" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                   </div>
                </div>
                 <div class="pt-6 flex items-center gap-4">
                    <button (click)="saveNotificationSettings()" [disabled]="isSavingNotifications()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-600">
                      @if(isSavingNotifications()) {
                        <span>Saving...</span>
                      } @else {
                        <span>Save Settings</span>
                      }
                    </button>
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
  dataService = inject(DataService);

  profileSaveStatus = signal<'idle' | 'saving' | 'saved'>('idle');
  passwordUpdateStatus = signal<{ status: 'idle' | 'updating' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });

  // --- Mock logic for notification settings ---
  notificationSettings = signal({ email: true, push: false });
  isSavingNotifications = signal(false);

  async saveProfile(form: NgForm) {
    if (!form.valid) return;
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;
    
    this.profileSaveStatus.set('saving');

    const updatedUser: User = {
      ...currentUser,
      name: form.value.name,
      jobTitle: form.value.jobTitle,
    };
    
    await this.dataService.updateUser(updatedUser);

    setTimeout(() => {
        this.profileSaveStatus.set('saved');
        setTimeout(() => this.profileSaveStatus.set('idle'), 2000);
    }, 500);
  }

  async updatePassword(form: NgForm) {
    if (!form.valid) return;

    const { currentPassword, newPassword, confirmPassword } = form.value;
    
    if (newPassword !== confirmPassword) {
      this.passwordUpdateStatus.set({ status: 'error', message: 'New passwords do not match.' });
      return;
    }
    
    this.passwordUpdateStatus.set({ status: 'updating', message: '' });

    const result = await this.authService.changePassword(currentPassword, newPassword);

    if (result.success) {
      this.passwordUpdateStatus.set({ status: 'success', message: result.message });
      form.resetForm();
    } else {
      this.passwordUpdateStatus.set({ status: 'error', message: result.message });
    }
  }

  updateEmailNotification(checked: boolean) {
    this.notificationSettings.update(s => ({...s, email: checked}));
  }

  updatePushNotification(checked: boolean) {
    this.notificationSettings.update(s => ({...s, push: checked}));
  }

  saveNotificationSettings() {
    this.isSavingNotifications.set(true);
    console.log('Saving notification settings:', this.notificationSettings());
    setTimeout(() => {
        this.isSavingNotifications.set(false);
        // In a real app, you might show a toast message
    }, 1000);
  }
}