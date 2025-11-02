import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ViewService } from '../../services/view.service';
import { ModalService } from '../../services/modal.service';
import { TableService } from '../../services/table.service';
import { AuthService } from '../../services/auth.service';
import { Contact, User } from '../../models/crm.models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-users-roles',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold mb-6" [class]="themeService.c('text-primary')">Users & Roles</h2>
      <div class="border-b" [class]="themeService.c('border-primary')">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          @if (isUserAdmin()) {
          <button
            (click)="viewService.usersAndRolesView.set('users')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="viewService.usersAndRolesView() === 'users' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' hover:text-slate-200 hover:border-slate-600'"
          >
            Users
          </button>
          <button
            (click)="viewService.usersAndRolesView.set('roles')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="viewService.usersAndRolesView() === 'roles' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' hover:text-slate-200 hover:border-slate-600'"
          >
            Roles
          </button>
          }
          @if (isUserAdminOrManager()) {
            <button
              (click)="viewService.usersAndRolesView.set('team')"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
              [class]="viewService.usersAndRolesView() === 'team' ? themeService.c('border-accent') + ' ' + themeService.c('text-accent') : 'border-transparent ' + themeService.c('text-secondary') + ' hover:text-slate-200 hover:border-slate-600'"
            >
              Team Management
            </button>
          }
        </nav>
      </div>

      <div class="mt-6">
        @switch(viewService.usersAndRolesView()) {
          @case('users') {
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold" [class]="themeService.c('text-primary')">All Users</h3>
              <button 
                  (click)="startAdding()" 
                  [disabled]="isAdding()" 
                  [title]="authService.canAddUser() ? 'Invite a new user' : 'Your plan limit has been reached. Please upgrade.'"
                  class="px-4 py-2 rounded-md disabled:cursor-not-allowed" 
                  [class.cursor-not-allowed]="!authService.canAddUser()"
                  [class]="(authService.canAddUser() ? themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') : themeService.c('bg-disabled')) + ' ' + themeService.c('text-on-accent')">
                  Invite User
              </button>
            </div>
              <div class="shadow-sm rounded-lg overflow-x-auto border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              <table class="min-w-full leading-normal">
                <thead>
                  <tr [class]="themeService.c('bg-base')">
                    <th class="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Name</th>
                    <th class="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Email</th>
                    <th class="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Role</th>
                    <th class="px-5 py-3 border-b-2 text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Status</th>
                    <th class="px-5 py-3 border-b-2" [class]="themeService.c('border-primary')"></th>
                  </tr>
                </thead>
                <tbody>
                  @if (isAdding()) {
                    <tr [class]="themeService.c('bg-secondary') + '/50'">
                      <td class="px-5 py-2 border-b" [class]="themeService.c('border-primary')"><input type="text" [(ngModel)]="newUser.name" placeholder="Full Name" class="w-full border rounded-md px-2 py-1 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')"></td>
                      <td class="px-5 py-2 border-b" [class]="themeService.c('border-primary')"><input type="email" [(ngModel)]="newUser.email" placeholder="Email Address" class="w-full border rounded-md px-2 py-1 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')"></td>
                      <td class="px-5 py-2 border-b" [class]="themeService.c('border-primary')">
                        <select [(ngModel)]="newUser.roleId" class="w-full border rounded-md px-2 py-1 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                          @for (role of dataService.roles(); track role.id) {
                            <option [value]="role.id">{{ role.name }}</option>
                          }
                        </select>
                      </td>
                      <td class="px-5 py-2 border-b text-sm" [class]="themeService.c('border-primary')">
                        <span class="relative inline-block px-3 py-1 font-semibold leading-tight" [class]="themeService.c('text-warning')">
                          <span aria-hidden class="absolute inset-0 rounded-full opacity-100" [class]="themeService.c('bg-warning-subtle')"></span>
                          <span class="relative">Invited</span>
                        </span>
                      </td>
                      <td class="px-5 py-2 border-b text-right whitespace-nowrap" [class]="themeService.c('border-primary')">
                        <button (click)="saveNewUser()" class="text-sm font-medium mr-2" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover')">Save</button>
                        <button (click)="cancelAdd()" class="text-sm font-medium" [class]="themeService.c('text-secondary') + ' ' + 'hover:text-primary'">Cancel</button>
                      </td>
                    </tr>
                  }
                  @for(user of paginatedUsers(); track user.id) {
                    <tr>
                      <td class="px-5 py-4 border-b text-sm font-medium" [class]="themeService.c('border-primary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-primary')">{{user.name}}</td>
                      <td class="px-5 py-4 border-b text-sm" [class]="themeService.c('border-primary') + ' ' + themeService.c('bg-primary')">{{user.email}}</td>
                      <td class="px-5 py-4 border-b text-sm" [class]="themeService.c('border-primary') + ' ' + themeService.c('bg-primary')">{{getRoleName(user.roleId)}}</td>
                      <td class="px-5 py-4 border-b text-sm" [class]="themeService.c('border-primary') + ' ' + themeService.c('bg-primary')">
                        <span class="relative inline-block px-3 py-1 font-semibold leading-tight"
                          [class]="user.status === 'Active' ? themeService.c('text-success') : user.status === 'Invited' ? themeService.c('text-warning') : themeService.c('text-danger')"
                        >
                          <span aria-hidden class="absolute inset-0 rounded-full opacity-100"
                            [class]="user.status === 'Active' ? themeService.c('bg-success-subtle') : user.status === 'Invited' ? themeService.c('bg-warning-subtle') : themeService.c('bg-danger-subtle')"
                          ></span>
                          <span class="relative">{{user.status}}</span>
                        </span>
                      </td>
                      <td class="px-5 py-4 border-b text-sm text-right" [class]="themeService.c('border-primary') + ' ' + themeService.c('bg-primary')">
                        <button (click)="modalService.openUserModal(user)" class="font-medium" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover')">Edit</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
               <!-- Users Pagination Controls -->
              @if (usersTotalPages() > 0 && allUsers().length > 0) {
                <div class="flex items-center justify-between py-3 px-4 border-t rounded-b-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
                  <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                    <div>
                      <p class="text-sm" [class]="themeService.c('text-base')">
                        Showing
                        <span class="font-medium">{{ usersStartItemNumber() }}</span>
                        to
                        <span class="font-medium">{{ usersEndItemNumber() }}</span>
                        of
                        <span class="font-medium">{{ allUsers().length }}</span>
                        results
                      </p>
                    </div>
                    <div class="flex items-center space-x-4">
                      <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md focus:outline-none text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-2') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                          <option value="10">10 per page</option>
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                      </select>
                      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button (click)="changeUsersPage(usersCurrentPage() - 1)" [disabled]="usersCurrentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                          <span class="sr-only">Previous</span>
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                        </button>
                        <span class="hidden sm:inline-flex relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> Page {{ usersCurrentPage() }} of {{ usersTotalPages() }} </span>
                        <span class="inline-flex sm:hidden relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> {{ usersCurrentPage() }} / {{ usersTotalPages() }} </span>
                        <button (click)="changeUsersPage(usersCurrentPage() + 1)" [disabled]="usersCurrentPage() >= usersTotalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                          <span class="sr-only">Next</span>
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
          @case('roles') {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (role of dataService.roles(); track role.id) {
                  <div class="shadow-sm rounded-lg p-6 border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
                    <h3 class="text-xl font-bold" [class]="themeService.c('text-primary')">{{ role.name }}</h3>
                    <p class="text-sm mt-1" [class]="themeService.c('text-secondary')">{{ role.id }}</p>
                  </div>
                }
              </div>
          }
          @case('team') {
            <div>
              <h3 class="text-lg font-semibold mb-4" [class]="themeService.c('text-primary')">Your Team ({{managerTeam().length}})</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                @for (member of managerTeam(); track member.id) {
                  <div class="p-6 rounded-lg shadow-sm border flex flex-col items-center text-center cursor-pointer transition-all duration-200" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary') + ' ' + themeService.c('hover:border-accent')">
                    <img [src]="member.profilePictureUrl" alt="Profile picture of {{member.name}}" class="w-16 h-16 rounded-full mb-3">
                    <p class="font-semibold" [class]="themeService.c('text-primary')">{{ member.name }}</p>
                    <p class="text-sm" [class]="themeService.c('text-secondary')">{{ member.jobTitle || getRoleName(member.roleId) }}</p>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersRolesComponent {
  dataService = inject(DataService);
  viewService = inject(ViewService);
  modalService = inject(ModalService);
  tableService = inject(TableService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isAdding = signal(false);
  newUser: Partial<User> = {};

  isUserAdmin = this.authService.isCurrentUserAdmin;
  isUserAdminOrManager = this.authService.isCurrentUserAdminOrManager;

  allUsers = computed(() => {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return [];
    return this.dataService.users().filter(u => u.companyId === currentUser.companyId);
  });

  managerTeam = computed<User[]>(() => {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.isUserAdminOrManager()) return [];
    
    // Admins see all users in the company
    if (this.isUserAdmin()) {
        return this.allUsers();
    }
    
    // Managers see their direct reports
    return this.dataService.users().filter(u => u.managerId === currentUser.id);
  });
  
  getRoleName(roleId: string): string | undefined {
    return this.dataService.roles().find(r => r.id === roleId)?.name;
  }

  startAdding() {
    if (!this.authService.canAddUser()) {
        const limit = this.authService.limitFor('user')();
        this.modalService.openUpgradeModal(`You have reached your plan's limit of ${limit} users. Please upgrade to add more.`);
        return;
    }
    this.isAdding.set(true);
    this.newUser = {
      roleId: 'role-3' // Default to Sales Rep
    };
  }
  
  cancelAdd() {
    this.isAdding.set(false);
  }

  async saveNewUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.roleId) {
      alert('Please fill in all fields.');
      return;
    }
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;
    
    const userToAdd: User = {
      id: `user-${Date.now()}`,
      name: this.newUser.name,
      email: this.newUser.email,
      roleId: this.newUser.roleId,
      companyId: currentUser.companyId,
      status: 'Invited',
      profilePictureUrl: `https://i.pravatar.cc/150?u=${this.newUser.email}`
    };
    
    await this.dataService.addUser(userToAdd);
    this.isAdding.set(false);
  }