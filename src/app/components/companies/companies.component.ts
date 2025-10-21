import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { Company } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-companies',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Companies</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search companies..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <button (click)="uiService.openImportModal('companies')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Import</button>
            <button (click)="uiService.activeColumnCustomization.set('companies')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Columns</button>
            <button 
              (click)="openAddCompanyModal()"
              [title]="authService.canAddCompany() ? 'Add a new company' : 'Your plan limit has been reached. Please upgrade.'"
              class="px-4 py-2 rounded-md text-sm font-medium"
              [class.cursor-not-allowed]="!authService.canAddCompany()"
              [class]="(authService.canAddCompany() ? (themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover')) : themeService.c('bg-disabled')) + ' ' + themeService.c('text-on-accent')">
              Add Company
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
              @for (company of paginatedCompanies(); track company.id) {
                <tr class="cursor-pointer" [class]="themeService.c('bg-primary-hover')" (click)="uiService.openCompanyDetails(company)">
                  @if (isColumnVisible('name')) {
                    <td class="px-4 py-3 text-sm font-medium" [class]="themeService.c('text-primary')">
                      <a href="#" (click)="$event.preventDefault(); $event.stopPropagation(); showContactPopover($event, company.id)" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover') + ' hover:underline'">
                        {{company.name}}
                      </a>
                    </td>
                  }
                  @if (isColumnVisible('industry')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{company.industry}}</td>
                  }
                  @if (isColumnVisible('website')) {
                    <td class="px-4 py-3 text-sm">
                      <a [href]="company.website" (click)="$event.stopPropagation()" target="_blank" class="hover:underline" [class]="themeService.c('text-accent')">{{company.website}}</a>
                    </td>
                  }
                  @if (isColumnVisible('createdAt')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{company.createdAt | date:'mediumDate'}}</td>
                  }
                   <td class="px-4 py-3"></td>
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length + 1" class="text-center py-8" [class]="themeService.c('text-secondary')">No companies found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredCompanies().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 border-t rounded-b-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredCompanies().length }}</span>
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
export class CompaniesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  searchTerm = signal('');
  
  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const userRole = this.authService.currentUserRole();
    if (!currentUser || !userRole) return [];

    const tenantUsers = this.dataService.users().filter(u => u.companyId === currentUser.companyId);
  
    if (userRole.name === 'Admin') {
      return tenantUsers.map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = tenantUsers.filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    
    return [currentUser.id]; // Sales Rep
  });
  
  private visibleCompanies = computed(() => {
    const userIds = new Set(this.getVisibleUserIds());
    // Only show client companies (which don't have a planId).
    return this.dataService.companies().filter(c => c.ownerId && userIds.has(c.ownerId) && !c.planId);
  });

  constructor() {
    effect(() => {
      // When the search term changes, reset the current page to 1.
      this.searchTerm(); // establish dependency
      this.uiService.setCurrentPage('companies', 1);
    });
  }

  columns = computed(() => this.uiService.tableColumnConfigs().companies);
  visibleColumns = computed(() => this.columns().filter(c => c.visible));
  isColumnVisible = (id: string) => this.visibleColumns().some(c => c.id === id);

  filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleCompanies().filter(company => 
      company.name.toLowerCase().includes(term) ||
      company.industry.toLowerCase().includes(term)
    );
  });

  openAddCompanyModal() {
    if (!this.authService.canAddCompany()) {
        const limit = this.authService.limitFor('company')();
        this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} companies. Please upgrade to add more.`);
        return;
    }
    this.uiService.openCompanyDetails(null);
  }

  // Pagination signals
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['companies'] || 1);
  totalPages = computed(() => {
    const total = this.filteredCompanies().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedCompanies = computed(() => {
    const allCompanies = this.filteredCompanies();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allCompanies.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredCompanies().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredCompanies().length);
  });

  // Methods to handle pagination changes
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('companies', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }

  showContactPopover(event: MouseEvent, companyId: string) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.uiService.openContactPopover({
      companyId: companyId,
      position: {
        x: rect.left,
        y: rect.bottom + 8
      }
    });
  }
}