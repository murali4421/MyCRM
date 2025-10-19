import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Case, CaseStatus, CasePriority } from '../../models/crm.models';

@Component({
  selector: 'app-cases',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Support Cases</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search cases..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto order-first sm:order-none">
            <button (click)="uiService.activeColumnCustomization.set('cases')" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Columns</button>
            <button (click)="uiService.openCaseModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">
                Add Case
            </button>
          </div>
      </div>
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-900">
            <tr>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{{col.label}}</th>
              }
            </tr>
          </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
              @for (kase of paginatedCases(); track kase.id) {
                <tr class="hover:bg-gray-700 cursor-pointer" (click)="uiService.openCaseModal(kase)">
                  @if (isColumnVisible('caseNumber')) {
                    <td class="px-4 py-3 text-sm font-medium text-gray-100">{{kase.caseNumber}}</td>
                  }
                  @if (isColumnVisible('subject')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{kase.subject}}</td>
                  }
                  @if (isColumnVisible('contact')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{ getContactName(kase.contactId) }}</td>
                  }
                  @if (isColumnVisible('status')) {
                    <td class="px-4 py-3 text-sm text-gray-300"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(kase.status)">{{ kase.status }}</span></td>
                  }
                   @if (isColumnVisible('priority')) {
                    <td class="px-4 py-3 text-sm font-medium" [class]="getPriorityClass(kase.priority)">{{ kase.priority }}</td>
                  }
                  @if (isColumnVisible('owner')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{ dataService.getUserById(kase.ownerId)?.name }}</td>
                  }
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length" class="text-center py-8 text-gray-400">No cases found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

      @if (totalPages() > 0 && filteredCases().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredCases().length }}</span>
                results
              </p>
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
      kase.subject.toLowerCase().includes(term) ||
      kase.caseNumber.toLowerCase().includes(term) ||
      this.getContactName(kase.contactId).toLowerCase().includes(term)
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

  getContactName(contactId: string): string {
    return this.dataService.contacts().find(c => c.id === contactId)?.name || 'N/A';
  }

  getStatusBadgeClass(status: CaseStatus): string {
    const map: Record<CaseStatus, string> = {
      [CaseStatus.New]: 'bg-sky-500/10 text-sky-300',
      [CaseStatus.InProgress]: 'bg-amber-500/10 text-amber-300',
      [CaseStatus.OnHold]: 'bg-gray-500/10 text-gray-300',
      [CaseStatus.Resolved]: 'bg-emerald-500/10 text-emerald-300',
      [CaseStatus.Closed]: 'bg-rose-500/10 text-rose-300',
    };
    return map[status];
  }
  
  getPriorityClass(priority: CasePriority): string {
    const map: Record<CasePriority, string> = {
      [CasePriority.Low]: 'text-gray-300',
      [CasePriority.Medium]: 'text-sky-300',
      [CasePriority.High]: 'text-amber-300',
      [CasePriority.Urgent]: 'text-red-400',
    };
    return map[priority];
  }
}
