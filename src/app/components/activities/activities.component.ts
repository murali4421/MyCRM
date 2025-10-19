import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { Activity } from '../../models/crm.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-activities',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Activities</h1>
           <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center space-x-1 bg-gray-700 rounded-md p-1 text-sm font-medium w-full sm:w-auto">
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
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto">
              <option value="all">All Types</option>
              <option value="Call summary">Call summary</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Note">Note</option>
            </select>
            <select [ngModel]="ownerFilter()" (ngModelChange)="ownerFilter.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto">
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
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto">
            <button (click)="startAdding()" [disabled]="isAdding()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">Log Activity</button>
          </div>
      </div>
      
      @if (isAdding()) {
        <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-4">
          <h3 class="text-lg font-semibold text-gray-100 mb-4">Log New Activity</h3>
          <form #newActivityForm="ngForm" (ngSubmit)="saveNewActivity(newActivityForm)">
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                  <label class="block text-sm font-medium text-gray-300">Type</label>
                  <select name="type" [ngModel]="newActivity().type" (ngModelChange)="updateNewActivityField('type', $event)" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    <option>Call summary</option>
                    <option>Email</option>
                    <option>Meeting</option>
                    <option>Note</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300">Date & Time</label>
                  <input type="datetime-local" name="startTime" [ngModel]="newActivity().startTime" (ngModelChange)="updateNewActivityField('startTime', $event)" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Subject</label>
                <input type="text" name="subject" [ngModel]="newActivity().subject" (ngModelChange)="updateNewActivityField('subject', $event)" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Description / Notes</label>
                 <div class="relative">
                    <textarea name="description" [ngModel]="newActivity().description" (ngModelChange)="updateNewActivityField('description', $event)" rows="3" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm"></textarea>
                    <button type="button" (click)="generateSummary()" [disabled]="geminiService.isGeneratingSummary() || !newActivity().description" class="absolute bottom-2 right-2 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-500/20 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        @if (geminiService.isGeneratingSummary()) {
                          <div class="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        } @else {
                          <span>✨ Summarize</span>
                        }
                    </button>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
              <button type="button" (click)="cancelAdd()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
              <button type="submit" [disabled]="!newActivityForm.valid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Activity</button>
            </div>
          </form>
        </div>
      }
      
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
                    <div class="relative flex space-x-3 cursor-pointer" (click)="editActivity(activity)">
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
                            <button (click)="$event.stopPropagation(); deleteActivity(activity.id)" class="text-red-500 hover:text-red-400 font-medium text-xs">Delete</button>
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
                  <tr class="hover:bg-gray-700 cursor-pointer" (click)="editActivity(activity)">
                    <td class="px-4 py-3 text-sm text-gray-300"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getBadgeClasses(activity.type)">{{ activity.type }}</span></td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-100">{{ activity.subject }}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">{{ dataService.getUserById(activity.ownerId)?.name }}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">{{ activity.relatedEntity ? dataService.getRelatedEntityName(activity.relatedEntity) : 'N/A' }}</td>
                    <td class="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{{ activity.startTime | date:'medium' }}</td>
                    <td class="px-4 py-3 text-sm text-right">
                      <button (click)="$event.stopPropagation(); deleteActivity(activity.id)" class="text-red-500 hover:text-red-400 font-medium">Delete</button>
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
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
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
export class ActivitiesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  geminiService = inject(GeminiService);
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  // View and Filter State
  viewMode = signal<'feed' | 'table'>('feed');
  searchTerm = signal('');
  typeFilter = signal<string>('all');
  ownerFilter = signal<string>('all');
  isAdding = signal(false);
  newActivity = signal<Partial<Activity>>({});

  constructor() {
    effect(() => {
      // When any filter changes, reset pagination to the first page
      this.searchTerm();
      this.typeFilter();
      this.ownerFilter();
      this.uiService.setCurrentPage('activities', 1);
    });
  }

  updateNewActivityField(field: keyof Partial<Activity>, value: any) {
    this.newActivity.update(activity => ({
      ...activity,
      [field]: value,
    }));
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

  async deleteActivity(activityId: string) {
    if (confirm('Are you sure you want to delete this activity?')) {
      await this.dataService.deleteActivity(activityId);
    }
  }
  
  startAdding() {
    this.newActivity.set({
      ownerId: this.authService.currentUser()?.id,
      startTime: new Date().toISOString().slice(0, 16),
      status: 'Done',
      type: 'Call summary'
    });
    this.isAdding.set(true);
  }

  cancelAdd() {
    this.isAdding.set(false);
  }
  
  async generateSummary() {
    const textToSummarize = this.newActivity().description;
    if (!textToSummarize) return;
    const result = await this.geminiService.generateActivitySummary(textToSummarize);
    if (result) {
        this.newActivity.update(activity => ({
            ...activity,
            subject: result.subject,
            description: result.description
        }));
    }
  }

  async saveNewActivity(form: NgForm) {
    if (form.invalid) return;

    const activityToAdd: Activity = {
      ...this.newActivity(),
      ...form.value,
      id: `act-${Date.now()}`,
      startTime: new Date(form.value.startTime).toISOString(),
      endTime: new Date(form.value.startTime).toISOString(),
      status: 'Done',
      ownerId: this.authService.currentUser()!.id,
    };
    await this.dataService.addActivity(activityToAdd);
    this.isAdding.set(false);
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
      'Call summary': `<path stroke-linecap="round" stroke-linejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 19v3m-4 0h8" />`,
      'Email': `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25-2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />`,
      'Meeting': `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493m-4.83 2.493a9.337 9.337 0 004.121.952A9.38 9.38 0 0015 19.128M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M5.106 5.106A7.5 7.5 0 0112 3.375c1.621 0 2.922.784 3.665 1.954C16.299 6.544 16.68 7.708 16.68 8.875c0 1.25-.401 2.414-1.003 3.438C15.048 13.513 13.632 14.25 12 14.25c-1.632 0-3.048-.737-3.665-1.937C7.701 11.289 7.32 10.125 7.32 8.875c0-1.167.393-2.331 1.003-3.438C8.952 4.159 10.368 3.375 12 3.375z" />`,
      'Note': `<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />`,
    };
    const svgContent = icons[type] || '';
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }
}
