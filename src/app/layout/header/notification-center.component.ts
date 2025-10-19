import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/crm.models';

@Component({
  selector: 'app-notification-center',
  imports: [CommonModule],
  template: `
    <div class="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-700 max-h-[80vh] flex flex-col">
      <header class="p-3 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
        <h3 class="font-semibold text-gray-100">Notifications</h3>
        @if (notificationService.unreadCount() > 0) {
          <button (click)="markAllAsRead()" class="text-xs font-medium text-indigo-400 hover:underline">
            Mark all as read
          </button>
        }
      </header>

      <div class="overflow-y-auto flex-1">
        @for (notification of userNotifications(); track notification.id) {
          <div 
            class="p-3 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer"
            [class.bg-indigo-500/10]="!notification.isRead"
            (click)="handleNotificationClick(notification)"
          >
            <div class="flex items-start space-x-3">
               @if (!notification.isRead) {
                <div class="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
              } @else {
                 <div class="w-2 h-2 flex-shrink-0"></div>
              }
              <div class="flex-1">
                <p class="text-sm text-gray-200">{{ notification.message }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ timeAgo(notification.createdAt) }}</p>
              </div>
            </div>
          </div>
        } @empty {
          <div class="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.95V4a1 1 0 10-2 0v1.05A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h4 class="mt-2 font-semibold text-gray-300">No new notifications</h4>
            <p class="text-sm text-gray-500">We'll let you know when something new happens.</p>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  
  userNotifications = computed(() => {
      const currentUserId = this.currentUser()?.id;
      if (!currentUserId) return [];
      return this.notificationService.notifications().filter(n => n.userId === currentUserId);
  });

  handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    // TODO: Navigate to link if it exists
    // if (notification.link) {
    //   this.uiService.changeView(notification.link.view);
    // }
    this.uiService.isNotificationCenterOpen.set(false);
  }

  markAllAsRead() {
    const userId = this.currentUser()?.id;
    if (userId) {
        this.notificationService.markAllAsRead(userId);
    }
  }

  timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  }
}
