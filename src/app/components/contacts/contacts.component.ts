import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Contact } from '../../models/crm.models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-contacts',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Contacts</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search contacts..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <button (click)="uiService.openImportModal('contacts')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Import</button>
            <button (click)="uiService.activeColumnCustomization.set('contacts')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Columns</button>
            <button 
                (click)="openAddContactModal()" 
                [disabled]="!authService.canAddContact()"
                [title]="authService.canAddContact() ? 'Add a new contact' : 'Your plan limit has been reached. Please upgrade.'"
                class="px-4 py-2 rounded-md text-sm font-medium disabled:cursor-not-allowed"
                [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled') + ' ' + themeService.c('text-on-accent')">
                Add Contact
            </button>
          </div>
      </div>
      <div class="rounded-lg shadow-sm border overflow-x-auto" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <table class="min-w-full">
          <thead [class]="themeService.c('bg-base')">
            <tr>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">{{col.label}}</th>
              }
              <th class="px-4 py-3 border-b" [class]="themeService.c('border-primary')"></th>
            </tr>
          </thead>
            <tbody class="divide-y" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              @for (contact of paginatedContacts(); track contact.id) {
                <tr class="cursor-pointer" [class]="themeService.c('bg-primary-hover')" (click)="uiService.openContactModal(contact)">
                  @if (isColumnVisible('name')) {
                    <td class="px-4 py-3 text-sm font-medium" [class]="themeService.c('text-primary')">{{contact.name}}</td>
                  }
                  @if (isColumnVisible('email')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{contact.email}}</td>
                  }
                  @if (isColumnVisible('phone')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{contact.phone}}</td>
                  }
                  @if (isColumnVisible('company')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ dataService.getCompanyById(contact.companyId)?.name }}</td>
                  }
                   @if (isColumnVisible('owner')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ dataService.getUserById(contact.ownerId)?.name }}</td>
                  }
                  <td class="px-4 py-3 text-sm text-right">
                    <button (click)="$event.stopPropagation(); openComposer(contact.id)" class="font-medium" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover')">Email</button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length + 1" class="text-center py-8" [class]="themeService.c('text-secondary')">No contacts found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

       <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredContacts().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 border-t rounded-b-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredContacts().length }}</span>
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
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  searchTerm = signal('');

  constructor() {
    effect(() => {
      // When search term changes, reset page.
      this.searchTerm();
      this.uiService.setCurrentPage('contacts', 1);
    });
  }

  columns = computed(() => this.uiService.tableColumnConfigs().contacts);
  visibleColumns = computed(() => this.columns().filter(c => c.visible));
  isColumnVisible = (id: string) => this.visibleColumns().some(c => c.id === id);

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = this.dataService.roles();

    if (!currentUser || !currentUser.roleId || !allRoles.length) {
      return [];
    }
    
    const userRole = allRoles.find(r => r.id === currentUser.roleId);

    if (!userRole || !userRole.name) {
      return [];
    }
  
    if (userRole.name === 'Admin') {
      return this.dataService.users().map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = this.dataService.users().filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    
    return [currentUser.id]; // Sales Rep
  });

  visibleContacts = computed(() => this.dataService.contacts().filter(c => this.getVisibleUserIds().includes(c.ownerId)));

  filteredContacts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleContacts().filter(contact => 
      contact.name.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term)
    );
  });

  openAddContactModal() {
    if (!this.authService.canAddContact()) {
        const limit = this.authService.limitFor('contact')();
        this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} contacts. Please upgrade to add more.`);
        return;
    }
    this.uiService.openContactModal(null);
  }

  // Pagination signals
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['contacts'] || 1);
  totalPages = computed(() => {
    const total = this.filteredContacts().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedContacts = computed(() => {
    const allContacts = this.filteredContacts();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allContacts.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredContacts().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredContacts().length);
  });

  // Methods to handle pagination changes
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('contacts', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }

  openComposer(contactId: string) {
    const contact = this.dataService.contacts().find(c => c.id === contactId);
    if (contact) {
      this.uiService.openEmailComposer({
        to: contact.email,
        subject: '',
        body: '',
        relatedEntity: { type: 'contact', id: contact.id }
      });
    }
  }
}