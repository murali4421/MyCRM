import { Injectable, signal, computed, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from '../models/crm.models';
import { UiService } from './ui.service';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private uiService = inject(UiService);
  private loggingService = inject(LoggingService);

  // In a real app, this would be null until a user logs in.
  // We'll mock a logged-in user for demonstration.
  currentUser = signal<User | null>(null);

  isAuthenticated = computed(() => !!this.currentUser());
  authError = signal<string | null>(null);
  passwordStrength = signal(0);

  login(form: NgForm) {
    this.authError.set(null);
    if (form.value.email === 'admin@crm.com' && form.value.password === 'password123') {
      // FIX: Explicitly typed the user object as User to ensure its 'status' property conforms to the expected union type ('Active' | 'Inactive' | 'Invited').
      const user: User = {
        id: 'user-1',
        name: 'Alex Johnson',
        email: 'alex.j@example.com',
        roleId: 'role-1', // Admin
        status: 'Active',
        profilePictureUrl: 'https://i.pravatar.cc/150?u=user-1',
        jobTitle: 'Sales Director'
      };
      this.currentUser.set(user);
      this.loggingService.log({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        action: 'login',
        details: `User ${user.name} logged in.`,
        entity: { type: 'user', id: user.id }
      });
    } else {
      this.authError.set('Invalid email or password.');
    }
  }

  logout() {
    const user = this.currentUser();
    if (user) {
        this.loggingService.log({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            action: 'logout',
            details: `User ${user.name} logged out.`,
            entity: { type: 'user', id: user.id }
        });
    }
    this.currentUser.set(null);
    this.uiService.authView.set('login');
  }

  signup(form: NgForm) {
    this.authError.set(null);
    console.log('Signing up with', form.value);
    // Simulate successful signup and login
    this.currentUser.set({
        id: 'user-new',
        name: form.value.name,
        email: form.value.email,
        roleId: 'role-3', // Sales Rep
        status: 'Active',
        profilePictureUrl: `https://i.pravatar.cc/150?u=${form.value.email}`
    });
  }
  
  requestPasswordReset(form: NgForm) {
    alert(`Password reset link sent to ${form.value.email}`);
    this.uiService.authView.set('login');
  }

  resetPassword(form: NgForm) {
    alert(`Password has been reset.`);
    this.uiService.authView.set('login');
  }
  
  updatePasswordStrength(password: string) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    this.passwordStrength.set(strength);
  }
}