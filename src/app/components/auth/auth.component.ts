import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ViewService } from '../../services/view.service';
import { LogoComponent } from '../shared/logo/logo.component';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule, LogoComponent],
  template: `
    <div class="flex items-center justify-center min-h-screen p-4" [class]="themeService.c('bg-base')">
      <div class="w-full max-w-md">
        <div class="flex justify-center mb-8">
            <div class="flex items-center space-x-3">
              <app-logo sizeClass="w-10 h-10"></app-logo>
              <h1 class="text-3xl font-bold" [class]="themeService.c('text-accent')">Cortex CRM</h1>
            </div>
        </div>

        @switch (viewService.authView()) {
          @case ('login') {
            <div class="p-8 rounded-lg shadow-md border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              <h2 class="text-2xl font-bold text-center mb-6" [class]="themeService.c('text-primary')">Login</h2>
              <form #loginForm="ngForm" (ngSubmit)="authService.login(loginForm)">
                <div class="mb-4">
                  <label for="email" class="block text-sm font-medium" [class]="themeService.c('text-base')">Email Address</label>
                  <input type="email" name="email" ngModel required email #email="ngModel"
                    [class.border-red-500]="email.invalid && email.touched"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                  @if (email.invalid && email.touched) {
                    <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                      @if (email.errors?.['required']) { <p>Email is required.</p> }
                      @if (email.errors?.['email']) { <p>Please enter a valid email address.</p> }
                    </div>
                  }
                </div>
                <div class="mb-6">
                  <label for="password" class="block text-sm font-medium" [class]="themeService.c('text-base')">Password</label>
                  <input type="password" name="password" ngModel required #password="ngModel"
                    [class.border-red-500]="password.invalid && password.touched"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                   @if (password.invalid && password.touched) {
                      <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                        @if (password.errors?.['required']) { <p>Password is required.</p> }
                      </div>
                    }
                </div>
                <button type="submit" [disabled]="!loginForm.valid" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed"
                  [class]="(!loginForm.valid ? themeService.c('bg-disabled') : themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover')) + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('text-on-accent')">
                  Sign in
                </button>
                 @if(authService.authError()) {
                  <p class="text-sm mt-4 text-center" [class]="themeService.c('text-danger')">{{ authService.authError() }}</p>
                }
              </form>
              <p class="mt-6 text-center text-sm" [class]="themeService.c('text-secondary')">
                Don't have an account? 
                <a href="#" (click)="$event.preventDefault(); viewService.authView.set('signup')" class="font-medium hover:underline" [class]="themeService.c('text-accent')">
                  Sign up
                </a>
              </p>
            </div>
          }
          @case ('signup') {
            <div class="p-8 rounded-lg shadow-md border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              <h2 class="text-2xl font-bold text-center mb-6" [class]="themeService.c('text-primary')">Create Account</h2>
              <form #signupForm="ngForm" (ngSubmit)="authService.signup(signupForm)">
                 <div class="mb-4">
                  <label for="companyName" class="block text-sm font-medium" [class]="themeService.c('text-base')">Company Name</label>
                  <input type="text" name="companyName" ngModel required #companyName="ngModel"
                    [class.border-red-500]="companyName.invalid && companyName.touched"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                   @if (companyName.invalid && companyName.touched) {
                      <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                        @if (companyName.errors?.['required']) { <p>Company Name is required.</p> }
                      </div>
                    }
                </div>
                <div class="mb-4">
                  <label for="name" class="block text-sm font-medium" [class]="themeService.c('text-base')">Full Name</label>
                  <input type="text" name="name" ngModel required #name="ngModel"
                    [class.border-red-500]="name.invalid && name.touched"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                   @if (name.invalid && name.touched) {
                      <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                        @if (name.errors?.['required']) { <p>Full Name is required.</p> }
                      </div>
                    }
                </div>
                <div class="mb-4">
                  <label for="email" class="block text-sm font-medium" [class]="themeService.c('text-base')">Email Address</label>
                  <input type="email" name="email" ngModel required email #email="ngModel"
                    [class.border-red-500]="email.invalid && email.touched"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                  @if (email.invalid && email.touched) {
                    <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                      @if (email.errors?.['required']) { <p>Email is required.</p> }
                      @if (email.errors?.['email']) { <p>Please enter a valid email address.</p> }
                    </div>
                  }
                </div>
                <div class="mb-4">
                  <label for="password" class="block text-sm font-medium" [class]="themeService.c('text-base')">Password</label>
                  <input type="password" name="password" ngModel required minlength="8" #password="ngModel" (input)="authService.updatePasswordStrength(password.value)"
                    [class.border-red-500]="password.invalid && password.touched"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                   @if (password.invalid && password.touched) {
                      <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                        @if (password.errors?.['required']) { <p>Password is required.</p> }
                        @if (password.errors?.['minlength']) { <p>Password must be at least 8 characters long.</p> }
                      </div>
                    }
                  <!-- Password Strength Meter -->
                  @if (password.value) {
                    <div class="mt-2 flex space-x-1">
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 1 ? 'bg-red-500' : themeService.c('bg-disabled')"></div>
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 2 ? 'bg-yellow-500' : themeService.c('bg-disabled')"></div>
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 3 ? 'bg-orange-500' : themeService.c('bg-disabled')"></div>
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 4 ? 'bg-green-500' : themeService.c('bg-disabled')"></div>
                    </div>
                  }
                </div>
                <div class="mb-6">
                  <label for="confirmPassword" class="block text-sm font-medium" [class]="themeService.c('text-base')">Confirm Password</label>
                  <input type="password" name="confirmPassword" ngModel required #confirmPassword="ngModel"
                    [class.border-red-500]="confirmPassword.touched && (confirmPassword.invalid || password.value !== confirmPassword.value)"
                    class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1"
                    [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                  @if (confirmPassword.touched) {
                    <div class="text-xs mt-1" [class]="themeService.c('text-danger')">
                      @if (confirmPassword.errors?.['required']) {
                        <p>Confirming your password is required.</p>
                      } @else if (password.value !== confirmPassword.value) {
                        <p>Passwords do not match.</p>
                      }
                    </div>
                  }
                </div>
                <button type="submit" [disabled]="!signupForm.valid || (password.value !== confirmPassword.value)" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [class]="(!signupForm.valid || (password.value !== confirmPassword.value) ? themeService.c('bg-disabled') : themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover')) + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('text-on-accent')">
                  Sign up
                </button>
                @if(authService.authError()) {
                  <p class="text-sm mt-4 text-center" [class]="themeService.c('text-danger')">{{ authService.authError() }}</p>
                }
              </form>
              <p class="mt-6 text-center text-sm" [class]="themeService.c('text-secondary')">
                Already have an account?
                <a href="#" (click)="$event.preventDefault(); viewService.authView.set('login')" class="font-medium hover:underline" [class]="themeService.c('text-accent')">
                  Log in
                </a>
              </p>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  authService = inject(AuthService);
  viewService = inject(ViewService);
  themeService = inject(ThemeService);
}
