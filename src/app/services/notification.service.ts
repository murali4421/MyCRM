import { Injectable, signal, computed, inject } from '@angular/core';
import { Notification } from '../models/crm.models';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  // Method to add a notification for a specific user
  addNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    this.notifications.update(current => [newNotification, ...current]);
  }

  markAsRead(notificationId: string) {
    this.notifications.update(current =>
      current.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }

  markAllAsRead(userId: string) {
    this.notifications.update(current =>
      current.map(n => (n.userId === userId && !n.isRead) ? { ...n, isRead: true } : n)
    );
  }
}
