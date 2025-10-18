import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { LogoComponent } from '../shared/logo/logo.component';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule, LogoComponent],
  template: `
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="w-full max-w-md">
        <div class="flex justify-center mb-8">
            <div class="flex items-center space-x-3">
              <app-logo sizeClass="w-10 h-10"></app-logo>
              <h1 class="text-3xl font-bold text-gray-100">Cortex CRM</h1>
            </div>
        </div>

        @switch (uiService.authView()) {
          @case ('login') {
            <div class="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
              <h2 class="text-2xl font-bold text-center text-gray-100 mb-6">Login</h2>
              <form #loginForm="ngForm" (ngSubmit)="authService.login(loginForm)">
                <div class="mb-4">
                  <label for="email" class="block text-sm font-medium text-gray-300">Email Address</label>
                  <input type="email" name="email" ngModel required email #email="ngModel"
                    [class.border-red-500]="email.invalid && email.touched"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  @if (email.invalid && email.touched) {
                    <div class="text-red-500 text-xs mt-1">
                      @if (email.errors?.['required']) { <p>Email is required.</p> }
                      @if (email.errors?.['email']) { <p>Please enter a valid email address.</p> }
                    </div>
                  }
                </div>
                <div class="mb-6">
                  <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
                  <input type="password" name="password" ngModel required #password="ngModel"
                    [class.border-red-500]="password.invalid && password.touched"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                   @if (password.invalid && password.touched) {
                      <div class="text-red-500 text-xs mt-1">
                        @if (password.errors?.['required']) { <p>Password is required.</p> }
                      </div>
                    }
                </div>
                <button type="submit" [disabled]="!loginForm.valid" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600">
                  Sign in
                </button>
                 @if(authService.authError()) {
                  <p class="text-red-500 text-sm mt-4 text-center">{{ authService.authError() }}</p>
                }
              </form>
              <p class="mt-6 text-center text-sm text-gray-400">
                Don't have an account? 
                <a href="#" (click)="$event.preventDefault(); uiService.authView.set('signup')" class="font-medium text-indigo-400 hover:underline">
                  Sign up
                </a>
              </p>
            </div>
          }
          @case ('signup') {
            <div class="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
              <h2 class="text-2xl font-bold text-center text-gray-100 mb-6">Create Account</h2>
              <form #signupForm="ngForm" (ngSubmit)="authService.signup(signupForm)">
                 <div class="mb-4">
                  <label for="companyName" class="block text-sm font-medium text-gray-300">Company Name</label>
                  <input type="text" name="companyName" ngModel required #companyName="ngModel"
                    [class.border-red-500]="companyName.invalid && companyName.touched"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                   @if (companyName.invalid && companyName.touched) {
                      <div class="text-red-500 text-xs mt-1">
                        @if (companyName.errors?.['required']) { <p>Company Name is required.</p> }
                      </div>
                    }
                </div>
                <div class="mb-4">
                  <label for="name" class="block text-sm font-medium text-gray-300">Full Name</label>
                  <input type="text" name="name" ngModel required #name="ngModel"
                    [class.border-red-500]="name.invalid && name.touched"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                   @if (name.invalid && name.touched) {
                      <div class="text-red-500 text-xs mt-1">
                        @if (name.errors?.['required']) { <p>Full Name is required.</p> }
                      </div>
                    }
                </div>
                <div class="mb-4">
                  <label for="email" class="block text-sm font-medium text-gray-300">Email Address</label>
                  <input type="email" name="email" ngModel required email #email="ngModel"
                    [class.border-red-500]="email.invalid && email.touched"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  @if (email.invalid && email.touched) {
                    <div class="text-red-500 text-xs mt-1">
                      @if (email.errors?.['required']) { <p>Email is required.</p> }
                      @if (email.errors?.['email']) { <p>Please enter a valid email address.</p> }
                    </div>
                  }
                </div>
                <div class="mb-4">
                  <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
                  <input type="password" name="password" ngModel required minlength="8" #password="ngModel" (input)="authService.updatePasswordStrength(password.value)"
                    [class.border-red-500]="password.invalid && password.touched"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                   @if (password.invalid && password.touched) {
                      <div class="text-red-500 text-xs mt-1">
                        @if (password.errors?.['required']) { <p>Password is required.</p> }
                        @if (password.errors?.['minlength']) { <p>Password must be at least 8 characters long.</p> }
                      </div>
                    }
                  <!-- Password Strength Meter -->
                  @if (password.value) {
                    <div class="mt-2 flex space-x-1">
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 1 ? 'bg-red-500' : 'bg-gray-600'"></div>
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 2 ? 'bg-yellow-500' : 'bg-gray-600'"></div>
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 3 ? 'bg-orange-500' : 'bg-gray-600'"></div>
                      <div class="h-1 flex-1 rounded" [class]="authService.passwordStrength() >= 4 ? 'bg-green-500' : 'bg-gray-600'"></div>
                    </div>
                  }
                </div>
                <div class="mb-6">
                  <label for="confirmPassword" class="block text-sm font-medium text-gray-300">Confirm Password</label>
                  <input type="password" name="confirmPassword" ngModel required #confirmPassword="ngModel"
                    [class.border-red-500]="confirmPassword.touched && (confirmPassword.invalid || password.value !== confirmPassword.value)"
                    class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  @if (confirmPassword.touched) {
                    <div class="text-red-500 text-xs mt-1">
                      @if (confirmPassword.errors?.['required']) {
                        <p>Confirming your password is required.</p>
                      } @else if (password.value !== confirmPassword.value) {
                        <p>Passwords do not match.</p>
                      }
                    </div>
                  }
                </div>
                <button type="submit" [disabled]="!signupForm.valid || (password.value !== confirmPassword.value)" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600">
                  Sign up
                </button>
                @if(authService.authError()) {
                  <p class="text-red-500 text-sm mt-4 text-center">{{ authService.authError() }}</p>
                }
              </form>
              <p class="mt-6 text-center text-sm text-gray-400">
                Already have an account?
                <a href="#" (click)="$event.preventDefault(); uiService.authView.set('login')" class="font-medium text-indigo-400 hover:underline">
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
  uiService = inject(UiService);
}
