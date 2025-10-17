import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { Project } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-projects',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Projects</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search projects..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto order-first sm:order-none">
            <button (click)="uiService.activeColumnCustomization.set('projects')" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Columns</button>
            <button (click)="uiService.openProjectModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">Add Project</button>
          </div>
      </div>
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-900">
            <tr>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{{col.label}}</th>
              }
              <th class="px-4 py-3 border-b border-gray-700"></th>
            </tr>
          </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
              @for (project of paginatedProjects(); track project.id) {
                <tr class="hover:bg-gray-700 cursor-pointer" (click)="uiService.openProjectModal(project)">
                  @if (isColumnVisible('name')) {
                    <td class="px-4 py-3 text-sm font-medium text-gray-100">{{project.name}}</td>
                  }
                  @if (isColumnVisible('company')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{ dataService.getCompanyById(project.companyId)?.name }}</td>
                  }
                  @if (isColumnVisible('status')) {
                    <td class="px-4 py-3 text-sm text-gray-300">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(project.status)">
                            {{ project.status }}
                        </span>
                    </td>
                  }
                  @if (isColumnVisible('budget')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{project.budget | currency}}</td>
                  }
                   @if (isColumnVisible('endDate')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{project.endDate | date:'mediumDate'}}</td>
                  }
                  @if (isColumnVisible('owner')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{ dataService.getUserById(project.ownerId)?.name }}</td>
                  }
                  <td class="px-4 py-3 text-sm text-right">
                    <button (click)="$event.stopPropagation(); uiService.openProjectModal(project)" class="text-indigo-400 hover:text-indigo-300 font-medium">Details</button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                    <td [attr.colspan]="visibleColumns().length + 1" class="text-center py-8 text-gray-400">No projects found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredProjects().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredProjects().length }}</span>
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
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
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
export class ProjectsComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  searchTerm = signal('');

  constructor() {
    effect(() => {
      this.searchTerm(); // establish dependency
      this.uiService.setCurrentPage('projects', 1);
    });
  }

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

  visibleProjects = computed(() => this.dataService.projects().filter(p => this.getVisibleUserIds().includes(p.ownerId)));

  columns = computed(() => this.uiService.tableColumnConfigs().projects);
  visibleColumns = computed(() => this.columns().filter(c => c.visible));
  isColumnVisible = (id: string) => this.visibleColumns().some(c => c.id === id);

  filteredProjects = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleProjects().filter(project => 
      project.name.toLowerCase().includes(term) ||
      (this.dataService.getCompanyById(project.companyId)?.name.toLowerCase() || '').includes(term)
    );
  });

  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['projects'] || 1);
  totalPages = computed(() => {
    const total = this.filteredProjects().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedProjects = computed(() => {
    const allProjects = this.filteredProjects();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allProjects.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredProjects().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredProjects().length);
  });

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('projects', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }
  
  getStatusBadgeClass(status: Project['status']): string {
    const classMap: Record<Project['status'], string> = {
      'Planning': 'bg-gray-500/10 text-gray-300',
      'In Progress': 'bg-sky-500/10 text-sky-300',
      'Completed': 'bg-emerald-500/10 text-emerald-300',
      'On Hold': 'bg-amber-500/10 text-amber-300',
    };
    return classMap[status] || 'bg-gray-500/10 text-gray-300';
  }
}