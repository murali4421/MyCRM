import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { Activity } from '../../models/crm.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-activities',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Activities</h1>
           <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center space-x-1 bg-gray-700 rounded-md p-1 text-sm font-medium">
              <button 
                (click)="viewMode.set('feed')" 
                [class]="viewMode() === 'feed' ? 'bg-gray-900 text-gray-100 shadow-sm' : 'bg-transparent text-gray-400'" 
                class="px-3 py-1 rounded-md transition-colors">
                Feed
              </button>
              <button 
                (click)="viewMode.set('table')" 
                [class]="viewMode() === 'table' ? 'bg-gray-900 text-gray-100 shadow-sm' : 'bg-transparent text-gray-400'" 
                class="px-3 py-1 rounded-md transition-colors">
                Table
              </button>
            </div>
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
              <option value="all">All Types</option>
              <option value="Call summary">Call summary</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Note">Note</option>
            </select>
            <select [ngModel]="ownerFilter()" (ngModelChange)="ownerFilter.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
              <option value="all">All Owners</option>
              @for(user of dataService.users(); track user.id) {
                <option [value]="user.id">{{ user.name }}</option>
              }
            </select>
            <input 
              type="text" 
              placeholder="Search activities..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            <button (click)="uiService.openActivityEditModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">Log Activity</button>
          </div>
      </div>
      
      @if (viewMode() === 'feed') {
        <!-- Activity Feed View -->
        <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
          <div class="flow-root p-6">
            <ul role="list" class="-mb-8">
              @for (activity of paginatedActivities(); track activity.id; let isLast = $last) {
                <li>
                  <div class="relative pb-8">
                    @if(!isLast) {
                      <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-700" aria-hidden="true"></span>
                    }
                    <div class="relative flex space-x-3">
                      <div>
                        <span class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-gray-800"
                              [class]="getIconBgColor(activity.type)">
                          <svg class="h-5 w-5 text-white" 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke-width="1.5" 
                              stroke="currentColor" 
                              [innerHTML]="getIconPath(activity.type)">
                          </svg>
                        </span>
                      </div>
                      <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p class="text-sm text-gray-400">
                            <span class="font-medium text-gray-50">{{ activity.subject }}</span>
                            by {{ dataService.getUserById(activity.ownerId)?.name }}
                          </p>
                          <p class="text-sm text-gray-300 mt-1">{{ activity.description }}</p>
                          @if(activity.relatedEntity) {
                            <p class="text-xs text-gray-500 mt-1">Related to: {{ dataService.getRelatedEntityName(activity.relatedEntity) }}</p>
                          }
                        </div>
                        <div class="text-right text-sm whitespace-nowrap text-gray-400">
                          <time [dateTime]="activity.startTime">{{ activity.startTime | date:'short' }}</time>
                          <div class="mt-2 flex space-x-2 justify-end">
                            <button (click)="editActivity(activity)" class="text-indigo-400 hover:text-indigo-300 font-medium text-xs">Edit</button>
                            <button (click)="deleteActivity(activity.id)" class="text-red-500 hover:text-red-400 font-medium text-xs">Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              }
              @empty {
                <li class="text-center py-8 text-gray-400">No activities found.</li>
              }
            </ul>
          </div>
        </div>
      } @else {
        <!-- Activity Table View -->
        <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-900">
              <tr>
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Related To</th>
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th class="px-4 py-3 border-b border-gray-700"></th>
              </tr>
            </thead>
              <tbody class="bg-gray-800 divide-y divide-gray-700">
                @for (activity of paginatedActivities(); track activity.id) {
                  <tr class="hover:bg-gray-700">
                    <td class="px-4 py-3 text-sm text-gray-300"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getBadgeClasses(activity.type)">{{ activity.type }}</span></td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-100">{{ activity.subject }}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">{{ dataService.getUserById(activity.ownerId)?.name }}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">{{ activity.relatedEntity ? dataService.getRelatedEntityName(activity.relatedEntity) : 'N/A' }}</td>
                    <td class="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{{ activity.startTime | date:'medium' }}</td>
                    <td class="px-4 py-3 text-sm text-right space-x-2">
                      <button (click)="editActivity(activity)" class="text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>
                      <button (click)="deleteActivity(activity.id)" class="text-red-500 hover:text-red-400 font-medium">Delete</button>
                    </td>
                  </tr>
                }
                @empty {
                  <tr>
                    <td colspan="6" class="text-center py-8 text-gray-400">No activities found.</td>
                  </tr>
                }
              </tbody>
          </table>
        </div>
      }

       <!-- Pagination Controls -->
      @if (totalPages() > 0 && sortedActivities().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-300">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ sortedActivities().length }}</span>
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
                <span class="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ currentPage() }} of {{ totalPages() }} </span>
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
export class ActivitiesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  // View and Filter State
  viewMode = signal<'feed' | 'table'>('feed');
  searchTerm = signal('');
  typeFilter = signal<string>('all');
  ownerFilter = signal<string>('all');

  constructor() {
    effect(() => {
      // When any filter changes, reset pagination to the first page
      this.searchTerm();
      this.typeFilter();
      this.ownerFilter();
      this.uiService.setCurrentPage('activities', 1);
    });
  }

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = this.dataService.roles();
    if (!currentUser || !currentUser.roleId || !allRoles.length) return [];
    
    const userRole = allRoles.find(r => r.id === currentUser.roleId);
    if (!userRole || !userRole.name) return [];
  
    if (userRole.name === 'Admin') return this.dataService.users().map(u => u.id);
    if (userRole.name === 'Manager') {
      const teamMemberIds = this.dataService.users().filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    return [currentUser.id]; // Sales Rep
  });

  visibleActivities = computed(() => this.dataService.activities().filter(a => this.getVisibleUserIds().includes(a.ownerId)));
  
  filteredActivities = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const type = this.typeFilter();
    const owner = this.ownerFilter();
    return this.visibleActivities().filter(activity => {
      const searchTermMatch = activity.subject.toLowerCase().includes(term) || activity.description.toLowerCase().includes(term);
      const typeMatch = type === 'all' || activity.type === type;
      const ownerMatch = owner === 'all' || activity.ownerId === owner;
      return searchTermMatch && typeMatch && ownerMatch;
    });
  });

  sortedActivities = computed(() => this.filteredActivities().sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
  
  // Pagination signals
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['activities'] || 1);
  totalPages = computed(() => {
    const total = this.sortedActivities().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedActivities = computed(() => {
    const allActivities = this.sortedActivities();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allActivities.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.sortedActivities().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.sortedActivities().length);
  });

  // Methods
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('activities', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }
  
  editActivity(activity: Activity) {
    this.uiService.openActivityEditModal(activity);
  }

  deleteActivity(activityId: string) {
    if (confirm('Are you sure you want to delete this activity?')) {
      this.dataService.deleteActivity(activityId);
    }
  }
  
  // UI Helper methods
  getIconBgColor(type: Activity['type']): string {
    const colors: { [key: string]: string } = { 'Call summary': 'bg-amber-500', 'Email': 'bg-sky-500', 'Meeting': 'bg-violet-500', 'Note': 'bg-slate-500' };
    return colors[type] || 'bg-slate-500';
  }

  getBadgeClasses(type: Activity['type']): string {
    const classMap: { [key: string]: string } = {
        'Call summary': 'bg-amber-500/10 text-amber-300',
        'Email': 'bg-sky-500/10 text-sky-300',
        'Meeting': 'bg-violet-500/10 text-violet-300',
        'Note': 'bg-gray-500/10 text-gray-300'
    };
    return classMap[type] || 'bg-gray-500/10 text-gray-300';
  }

  getIconPath(type: Activity['type']): SafeHtml {
    const icons: { [key: string]: string } = {
      'Call summary': `<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.211-.992-.553-1.348l-1.447-1.448a1.5 1.5 0 00-2.122 0L16.5 17.25a8.25 8.25 0 01-11.42-11.42L6.75 4.5a1.5 1.5 0 000-2.122l-1.447-1.448A2.25 2.25 0 003.622 1.5H2.25z" />`,
      'Email': `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25-2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />`,
      'Meeting': `<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.513-.96 1.487-1.594 2.522-1.594m-2.522 0A3 3 0 006 18.72M18 18.72A9.094 9.094 0 0018 18.72m0 0A17.998 17.998 0 0012 15c-2.176 0-4.209.56-6 1.544m12-1.544c-.298-.354-.62-.682-.973-.973c-.353-.29-.718-.556-1.092-.796M12 15c-2.176 0-4.209-.56-6 1.544m0 0A17.998 17.998 0 0112 15m-6 1.544c.298.354.62.682.973.973c.353.29.718-.556 1.092.796M12 15c2.176 0-4.209-.56-6 1.544m6-1.544v-2.563a1.5 1.5 0 00-1.5-1.5h-1.5a1.5 1.5 0 00-1.5 1.5v2.563m0 0V15m0 0a9 9 0 1018 0a9 9 0 00-18 0z" />`,
      'Note': `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />`,
    };
    const svgContent = icons[type] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }
}