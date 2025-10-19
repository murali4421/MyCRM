import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Contact, User } from '../../models/crm.models';

@Component({
  selector: 'app-users-roles',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h2 class="text-2xl font-semibold text-gray-100 mb-6">Users & Roles</h2>
      <div class="border-b border-gray-700">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          @if (isUserAdmin()) {
          <button
            (click)="uiService.usersAndRolesView.set('users')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="uiService.usersAndRolesView() === 'users' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'"
          >
            Users
          </button>
          <button
            (click)="uiService.usersAndRolesView.set('roles')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="uiService.usersAndRolesView() === 'roles' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'"
          >
            Roles
          </button>
          }
          @if (isUserAdminOrManager()) {
            <button
              (click)="uiService.usersAndRolesView.set('team')"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
              [class]="uiService.usersAndRolesView() === 'team' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'"
            >
              Team Management
            </button>
          }
        </nav>
      </div>

      <div class="mt-6">
        @switch(uiService.usersAndRolesView()) {
          @case('users') {
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-100">All Users</h3>
              <button 
                  (click)="startAdding()" 
                  [disabled]="isAdding() || !authService.canAddUser()" 
                  [title]="authService.canAddUser() ? 'Invite a new user' : 'Your plan limit has been reached. Please upgrade.'"
                  class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                  Invite User
              </button>
            </div>
              <div class="bg-gray-800 shadow-sm rounded-lg overflow-x-auto border border-gray-700">
              <table class="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                    <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900"></th>
                  </tr>
                </thead>
                <tbody>
                  @if (isAdding()) {
                    <tr class="bg-gray-700/50">
                      <td class="px-5 py-2 border-b border-gray-700"><input type="text" [(ngModel)]="newUser.name" placeholder="Full Name" class="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-sm"></td>
                      <td class="px-5 py-2 border-b border-gray-700"><input type="email" [(ngModel)]="newUser.email" placeholder="Email Address" class="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-sm"></td>
                      <td class="px-5 py-2 border-b border-gray-700">
                        <select [(ngModel)]="newUser.roleId" class="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md px-2 py-1 text-sm">
                          @for (role of dataService.roles(); track role.id) {
                            <option [value]="role.id">{{ role.name }}</option>
                          }
                        </select>
                      </td>
                      <td class="px-5 py-2 border-b border-gray-700 text-sm">
                        <span class="relative inline-block px-3 py-1 font-semibold leading-tight text-amber-300">
                          <span aria-hidden class="absolute inset-0 rounded-full opacity-20 bg-amber-500"></span>
                          <span class="relative">Invited</span>
                        </span>
                      </td>
                      <td class="px-5 py-2 border-b border-gray-700 text-right whitespace-nowrap">
                        <button (click)="saveNewUser()" class="text-sm font-medium text-indigo-400 hover:text-indigo-300 mr-2">Save</button>
                        <button (click)="cancelAdd()" class="text-sm font-medium text-gray-400 hover:text-gray-200">Cancel</button>
                      </td>
                    </tr>
                  }
                  @for(user of paginatedUsers(); track user.id) {
                    <tr>
                      <td class="px-5 py-4 border-b border-gray-700 bg-gray-800 text-sm font-medium text-gray-50">{{user.name}}</td>
                      <td class="px-5 py-4 border-b border-gray-700 bg-gray-800 text-sm">{{user.email}}</td>
                      <td class="px-5 py-4 border-b border-gray-700 bg-gray-800 text-sm">{{getRoleName(user.roleId)}}</td>
                      <td class="px-5 py-4 border-b border-gray-700 bg-gray-800 text-sm">
                        <span class="relative inline-block px-3 py-1 font-semibold leading-tight"
                          [class.text-emerald-300]="user.status === 'Active'"
                          [class.text-amber-300]="user.status === 'Invited'"
                          [class.text-rose-300]="user.status === 'Inactive'"
                        >
                          <span aria-hidden class="absolute inset-0 rounded-full opacity-20"
                            [class.bg-emerald-500]="user.status === 'Active'"
                            [class.bg-amber-500]="user.status === 'Invited'"
                            [class.bg-rose-500]="user.status === 'Inactive'"
                          ></span>
                          <span class="relative">{{user.status}}</span>
                        </span>
                      </td>
                      <td class="px-5 py-4 border-b border-gray-700 bg-gray-800 text-sm text-right">
                        <button (click)="uiService.openUserModal(user)" class="text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
               <!-- Users Pagination Controls -->
              @if (usersTotalPages() > 0 && allUsers().length > 0) {
                <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
                  <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                    <div>
                      <p class="text-sm text-gray-300">
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
                      <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                          <option value="10">10 per page</option>
                          <option value="25">25 per page</option>
                          <option value="50">50 per page</option>
                      </select>
                      <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button (click)="changeUsersPage(usersCurrentPage() - 1)" [disabled]="usersCurrentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                          <span class="sr-only">Previous</span>
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                        </button>
                        <span class="hidden sm:inline-flex relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ usersCurrentPage() }} of {{ usersTotalPages() }} </span>
                        <span class="inline-flex sm:hidden relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> {{ usersCurrentPage() }} / {{ usersTotalPages() }} </span>
                        <button (click)="changeUsersPage(usersCurrentPage() + 1)" [disabled]="usersCurrentPage() >= usersTotalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
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
                  <div class="bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-700">
                    <h3 class="text-xl font-bold text-gray-100">{{ role.name }}</h3>
                    <p class="text-sm text-gray-400 mt-1">{{ role.id }}</p>
                  </div>
                }
              </div>
          }
          @case('team') {
            <div>
              <h3 class="text-lg font-semibold mb-4 text-gray-100">Your Team ({{managerTeam().length}})</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                @for (member of managerTeam(); track member.id) {
                  <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-indigo-500 transition-all duration-200">
                    <img class="w-20 h-20 rounded-full mb-4" [src]="member.profilePictureUrl" [alt]="member.name">
                    <p class="font-semibold text-gray-100 text-lg">{{ member.name }}</p>
                    <p class="text-sm text-gray-400">{{ getRoleName(member.roleId) }}</p>
                  </div>
                }
              </div>

              <h3 class="text-lg font-semibold mb-4 mt-8 text-gray-100">Team Contacts</h3>
              <div class="bg-gray-800 shadow-sm rounded-lg overflow-x-auto border border-gray-700">
                <table class="min-w-full leading-normal">
                    <thead>
                    <tr>
                      <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                      <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                      <th class="px-5 py-3 border-b-2 border-gray-700 bg-gray-900 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-700">
                    @for(contact of paginatedTeamContacts(); track contact.id) {
                      <tr class="even:bg-white/5 hover:bg-white/10">
                        <td class="px-5 py-4 text-sm font-medium text-gray-100">{{contact.name}}</td>
                        <td class="px-5 py-4 text-sm text-gray-300">{{dataService.getCompanyById(contact.companyId)?.name}}</td>
                        <td class="px-5 py-4 text-sm">
                          <select [ngModel]="contact.ownerId" (change)="reassignOwner('contact', contact.id, $any($event.target).value)" class="p-2 border rounded-md bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                            @for(member of managerTeam(); track member.id) {
                              <option [value]="member.id">{{member.name}}</option>
                            }
                          </select>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
                 <!-- Team Contacts Pagination Controls -->
                 @if (teamContactsTotalPages() > 0 && teamContacts().length > 0) {
                    <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
                    <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                        <div>
                        <p class="text-sm text-gray-300">
                            Showing
                            <span class="font-medium">{{ teamContactsStartItemNumber() }}</span>
                            to
                            <span class="font-medium">{{ teamContactsEndItemNumber() }}</span>
                            of
                            <span class="font-medium">{{ teamContacts().length }}</span>
                            results
                        </p>
                        </div>
                        <div class="flex items-center space-x-4">
                        <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                            <option value="10">10 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button (click)="changeTeamContactsPage(teamContactsCurrentPage() - 1)" [disabled]="teamContactsCurrentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                            <span class="sr-only">Previous</span>
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                            </button>
                            <span class="hidden sm:inline-flex relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ teamContactsCurrentPage() }} of {{ teamContactsTotalPages() }} </span>
                            <span class="inline-flex sm:hidden relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> {{ teamContactsCurrentPage() }} / {{ teamContactsTotalPages() }} </span>
                            <button (click)="changeTeamContactsPage(teamContactsCurrentPage() + 1)" [disabled]="teamContactsCurrentPage() >= teamContactsTotalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                            <span class="sr-only">Next</span>
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                            </button>
                        </nav>
                        </div>
                    </div>
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
  uiService = inject(UiService);
  authService = inject(AuthService);

  isAdding = signal(false);
  newUser: Partial<User> = {};
  
  isUserAdmin = this.authService.isCurrentUserAdmin;
  isUserAdminOrManager = this.authService.isCurrentUserAdminOrManager;

  managerTeam = computed<User[]>(() => {
    const currentUser = this.authService.currentUser();
    if (this.authService.currentUserRole()?.name !== 'Manager' || !currentUser) {
      return [];
    }
    return this.dataService.users().filter(u => u.managerId === currentUser.id);
  });
  
  teamContacts = computed<Contact[]>(() => {
    const teamIds = this.managerTeam().map(m => m.id);
    if (!teamIds.length) {
      return [];
    }
    return this.dataService.contacts().filter(c => teamIds.includes(c.ownerId));
  });

  async reassignOwner(type: 'contact', id: string, newOwnerId: string) {
    if (type === 'contact') {
      await this.dataService.reassignContactOwner(id, newOwnerId);
    }
  }

  getRoleName(roleId: string): string {
    const roles = this.dataService.roles();
    if (!roleId || !roles.length) {
        return 'Role Not Assigned';
    }
    const role = roles.find(r => r.id === roleId);
    if (!role || !role.name) {
        return 'Unknown Role';
    }
    return role.name;
  }

  startAdding() {
    if (!this.authService.canAddUser()) {
        const limit = this.authService.limitFor('user')();
        this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} users. Please upgrade to add more.`);
        return;
    }
    this.newUser = { name: '', email: '', roleId: 'role-3' }; // Default role Sales Rep
    this.isAdding.set(true);
  }

  cancelAdd() {
    this.isAdding.set(false);
  }

  async saveNewUser() {
    if (!this.newUser.name?.trim() || !this.newUser.email?.trim() || !this.newUser.roleId) {
      alert('All fields are required.');
      return;
    }
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return;
    }
    const userToAdd: User = {
      id: `user-${Date.now()}`,
      status: 'Invited',
      profilePictureUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
      name: this.newUser.name,
      email: this.newUser.email,
      roleId: this.newUser.roleId,
      companyId: currentUser.companyId,
    };
    await this.dataService.addUser(userToAdd);
    this.isAdding.set(false);
  }

  // --- Common Pagination ---
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }
  
  // --- Users Table Pagination ---
  usersCurrentPage = computed(() => this.uiService.pagination().currentPage['users'] || 1);
  allUsers = this.dataService.users;
  usersTotalPages = computed(() => Math.ceil(this.allUsers().length / this.itemsPerPage()));
  paginatedUsers = computed(() => {
    const start = (this.usersCurrentPage() - 1) * this.itemsPerPage();
    return this.allUsers().slice(start, start + this.itemsPerPage());
  });
  usersStartItemNumber = computed(() => (this.usersCurrentPage() - 1) * this.itemsPerPage() + 1);
  usersEndItemNumber = computed(() => Math.min(this.usersCurrentPage() * this.itemsPerPage(), this.allUsers().length));
  changeUsersPage(newPage: number) {
    if (newPage > 0 && newPage <= this.usersTotalPages()) {
      this.uiService.setCurrentPage('users', newPage);
    }
  }

  // --- Team Contacts Table Pagination ---
  teamContactsCurrentPage = computed(() => this.uiService.pagination().currentPage['team-contacts'] || 1);
  teamContactsTotalPages = computed(() => Math.ceil(this.teamContacts().length / this.itemsPerPage()));
  paginatedTeamContacts = computed(() => {
    const start = (this.teamContactsCurrentPage() - 1) * this.itemsPerPage();
    return this.teamContacts().slice(start, start + this.itemsPerPage());
  });
  teamContactsStartItemNumber = computed(() => (this.teamContactsCurrentPage() - 1) * this.itemsPerPage() + 1);
  teamContactsEndItemNumber = computed(() => Math.min(this.teamContactsCurrentPage() * this.itemsPerPage(), this.teamContacts().length));
  changeTeamContactsPage(newPage: number) {
    if (newPage > 0 && newPage <= this.teamContactsTotalPages()) {
      this.uiService.setCurrentPage('team-contacts', newPage);
    }
  }
}