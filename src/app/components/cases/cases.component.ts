import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Case, CaseStatus, CasePriority } from '../../models/crm.models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-cases',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Support Cases</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search cases..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <button (click)="uiService.activeColumnCustomization.set('cases')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Columns</button>
            <button (click)="uiService.openCaseModal(null)" class="px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('text-on-accent')">
                Add Case
            </button>
          </div>
      </div>
      
      <!-- Desktop Table View -->
      <div class="hidden md:block rounded-lg shadow-sm border overflow-x-auto" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <table class="min-w-full">
          <thead [class]="themeService.c('bg-base')">
            <tr>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">{{col.label}}</th>
              }
            </tr>
          </thead>
            <tbody class="divide-y" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              @for (kase of paginatedCases(); track kase.id) {
                <tr class="cursor-pointer" [class]="themeService.c('bg-primary-hover')" (click)="uiService.openCaseModal(kase)">
                  @if (isColumnVisible('caseNumber')) {
                    <td class="px-4 py-3 text-sm font-medium" [class]="themeService.c('text-primary')">{{kase.caseNumber}}</td>
                  }
                  @if (isColumnVisible('subject')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{kase.subject}}</td>
                  }
                  @if (isColumnVisible('contact')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ getContactName(kase.contactId) }}</td>
                  }
                  @if (isColumnVisible('status')) {
                    <td class="px-4 py-3 text-sm"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(kase.status)">{{ kase.status }}</span></td>
                  }
                   @if (isColumnVisible('priority')) {
                    <td class="px-4 py-3 text-sm font-medium" [class]="getPriorityClass(kase.priority)">{{ kase.priority }}</td>
                  }
                  @if (isColumnVisible('owner')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ dataService.getUserById(kase.ownerId)?.name }}</td>
                  }
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length" class="text-center py-8" [class]="themeService.c('text-secondary')">No cases found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        @for (kase of paginatedCases(); track kase.id) {
          <div class="p-4 cursor-pointer rounded-lg shadow-sm border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')" (click)="uiService.openCaseModal(kase)">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-bold" [class]="themeService.c('text-primary')">{{ kase.caseNumber }}</p>
                <p class="text-sm" [class]="themeService.c('text-secondary')">{{ kase.subject }}</p>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(kase.status)">
                {{ kase.status }}
              </span>
            </div>
            <div class="flex justify-between items-center mt-3 text-sm">
                <p class="font-medium" [class]="getPriorityClass(kase.priority)">{{ kase.priority }} Priority</p>
                <p [class]="themeService.c('text-tertiary')">{{ dataService.getUserById(kase.ownerId)?.name }}</p>
            </div>
          </div>
        } @empty {
          <div class="p-8 text-center rounded-lg shadow-sm border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">
            No cases found.
          </div>
        }
      </div>

      @if (totalPages() > 0 && filteredCases().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 border-t rounded-b-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredCases().length }}</span>
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
export class CasesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  searchTerm = signal('');

  constructor() {
    effect(() => {
      this.searchTerm();
      this.uiService.setCurrentPage('cases', 1);
    });
  }

  columns = computed(() => this.uiService.tableColumnConfigs().cases);
  visibleColumns = computed(() => this.columns().filter(c => c.visible));
  isColumnVisible = (id: string) => this.visibleColumns().some(c => c.id === id);

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = this.dataService.roles();
    if (!currentUser || !currentUser.roleId || !allRoles.length) return [];
    
    const userRole = allRoles.find(r => r.id === currentUser.roleId);
    if (!userRole || !userRole.name) return [];
  
    if (userRole.name === 'Admin') {
      return this.dataService.users().map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = this.dataService.users().filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    
    return [currentUser.id]; // Sales Rep
  });

  private visibleCases = computed(() => this.dataService.cases().filter(c => this.getVisibleUserIds().includes(c.ownerId)));

  filteredCases = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleCases().filter(kase => 
      kase.caseNumber.toLowerCase().includes(term) ||
      kase.subject.toLowerCase().includes(term)
    );
  });

  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['cases'] || 1);
  totalPages = computed(() => {
    const total = this.filteredCases().length;
    const perPage = this.itemsPerPage();
    return total === 0 ? 0 : Math.ceil(total / perPage);
  });

  paginatedCases = computed(() => {
    const allCases = this.filteredCases();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allCases.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredCases().length;
    return total === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredCases().length);
  });

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('cases', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }
  
  getContactName(contactId: string): string {
    return this.dataService.getContactById(contactId)?.name || 'N/A';
  }

  getStatusBadgeClass(status: CaseStatus): string {
    const map: Record<CaseStatus, string> = {
      [CaseStatus.New]: this.themeService.c('bg-info-subtle') + ' ' + this.themeService.c('text-info'),
      [CaseStatus.InProgress]: this.themeService.c('bg-warning-subtle') + ' ' + this.themeService.c('text-warning'),
      [CaseStatus.OnHold]: this.themeService.c('bg-secondary') + ' ' + this.themeService.c('text-base'),
      [CaseStatus.Resolved]: this.themeService.c('bg-special-subtle') + ' ' + this.themeService.c('text-special'),
      [CaseStatus.Closed]: this.themeService.c('bg-success-subtle') + ' ' + this.themeService.c('text-success'),
    };
    return map[status];
  }
  
  getPriorityClass(priority: CasePriority): string {
    const map: Record<CasePriority, string> = {
      [CasePriority.Low]: this.themeService.c('text-info'),
      [CasePriority.Medium]: this.themeService.c('text-warning'),
      [CasePriority.High]: this.themeService.c('text-danger'),
      [CasePriority.Urgent]: 'font-bold ' + this.themeService.c('text-danger'),
    };
    return map[priority];
  }
}
