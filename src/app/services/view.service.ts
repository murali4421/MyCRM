import { Injectable, signal } from '@angular/core';
import { AppView, AuthView, ProfileView, UsersAndRolesView } from '../models/crm.models';

@Injectable({
  providedIn: 'root',
})
export class ViewService {
  // Main application view
  view = signal<AppView>('dashboard');
  
  // Sidebar state
  isSidebarOpen = signal(false);

  // Auth view state
  authView = signal<AuthView>('login');

  // Profile modal state
  profileView = signal<ProfileView>('personal-info');

  // Users & Roles page view
  usersAndRolesView = signal<UsersAndRolesView>('users');

  // --- View Management ---
  changeView(view: AppView) {
    this.view.set(view);
    this.isSidebarOpen.set(false);
  }
}
