import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe, PercentPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { OpportunityStage, AppView, Contact, Opportunity, Task, Activity, User } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, PercentPipe, CurrencyPipe],
  providers: [DatePipe],
  template: `
    <div>
      @if(authService.isPlanExpired()) {
        <div class="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
                <h3 class="font-bold">Your Plan Has Expired</h3>
                <p class="text-sm">Please upgrade your plan to restore full access to all features.</p>
            </div>
            <button (click)="activatePlan()" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium whitespace-nowrap">
                Activate Plan
            </button>
        </div>
      }
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div class="flex items-center space-x-2">
            <h1 class="text-3xl font-bold text-gray-100">Dashboard</h1>
            @if (lastRefreshed()) {
              <div class="flex items-center text-xs text-gray-400 pt-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M5.29 9.29a7.5 7.5 0 0110.42 0M19 20v-5h-5m-1.29-4.29a7.5 7.5 0 01-10.42 0" />
                </svg>
                <span>Last refreshed: {{ lastRefreshed() | date:'shortTime' }}</span>
              </div>
            }
          </div>
          <div class="flex items-center gap-2">
            <select [ngModel]="selectedPeriod()" (ngModelChange)="selectedPeriod.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                <option value="all">All Time</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
            </select>
          </div>
      </div>
      
      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-700">
          <h3 class="text-sm font-medium text-gray-400">Pipeline Value</h3>
          <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().pipelineValue | currency }}</p>
        </div>
        <div class="bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-700">
          <h3 class="text-sm font-medium text-gray-400">Opportunities</h3>
          <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().opportunitiesCount }}</p>
        </div>
        <div class="bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-700">
          <h3 class="text-sm font-medium text-gray-400">Win Rate</h3>
          <p class="text-3xl font-bold text-emerald-400 mt-1">{{ kpis().winRate | percent:'1.0-0' }}</p>
        </div>
        <div class="bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-700">
          <h3 class="text-sm font-medium text-gray-400">Revenue Won</h3>
          <p class="text-3xl font-bold text-emerald-400 mt-1">{{ kpis().revenueWon | currency }}</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <!-- Sales Pipeline -->
        <div class="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <h3 class="text-lg font-semibold text-gray-100 mb-4">Sales Pipeline</h3>
            <div class="space-y-4">
                @for(stage of pipelineStages(); track stage.name) {
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-medium text-gray-300">{{ stage.name }}</span>
                            <span class="text-sm text-gray-400">{{ stage.value | currency:'USD':'symbol':'1.0-0' }}</span>
                        </div>
                        <div class="bg-gray-700 rounded-full h-2.5">
                            <div class="bg-indigo-500 h-2.5 rounded-full" [style.width.%]="stage.percentage"></div>
                        </div>
                    </div>
                }
            </div>
        </div>

        <!-- Recent Activities -->
        <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <h3 class="text-lg font-semibold text-gray-100 p-4 border-b border-gray-700">Recent Activities</h3>
            <ul class="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                @for(activity of recentActivities(); track activity.id) {
                    <li class="p-4 hover:bg-gray-700/50">
                        <p class="text-sm font-medium text-gray-200">{{ activity.subject }}</p>
                        <p class="text-xs text-gray-400">{{ activity.type }} by {{ dataService.getUserById(activity.ownerId)?.name }} - {{ timeAgo(activity.startTime) }}</p>
                    </li>
                }
                @empty {
                   <li class="p-4 text-center text-sm text-gray-500">No recent activities.</li>
                }
            </ul>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  dataService = inject(DataService);
  uiService = inject(UiService);
  private datePipe = inject(DatePipe);
  
  lastRefreshed = signal<Date | null>(null);
  selectedPeriod = signal<'all' | '30d' | '90d'>('all');
  private refreshInterval: any;

  ngOnInit() {
    this.refreshData();
    this.refreshInterval = setInterval(() => this.refreshData(), 60000); // Refresh every minute
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
  }

  refreshData() {
    this.lastRefreshed.set(new Date());
  }
  
  activatePlan() {
    const user = this.authService.currentUser();
    if (user) {
        this.dataService.activatePlanForCompany(user.companyId);
    }
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
  
  private visibleOpportunities = computed(() => {
      const userIds = this.getVisibleUserIds();
      return this.dataService.opportunities().filter(o => userIds.includes(o.ownerId));
  });

  private filteredOpportunities = computed(() => {
    const period = this.selectedPeriod();
    if (period === 'all') {
      return this.visibleOpportunities();
    }
    const days = period === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.visibleOpportunities().filter(opp => new Date(opp.createdAt) >= cutoffDate);
  });
  
  kpis = computed(() => {
    const opps = this.filteredOpportunities();
    const openOpps = opps.filter(o => o.stage !== OpportunityStage.ClosedWon && o.stage !== OpportunityStage.ClosedLost);
    const closedOpps = opps.filter(o => o.stage === OpportunityStage.ClosedWon || o.stage === OpportunityStage.ClosedLost);
    const wonOpps = opps.filter(o => o.stage === OpportunityStage.ClosedWon);

    const pipelineValue = openOpps.reduce((sum, o) => sum + o.value, 0);
    const revenueWon = wonOpps.reduce((sum, o) => sum + o.value, 0);
    const winRate = closedOpps.length > 0 ? wonOpps.length / closedOpps.length : 0;
    
    return {
      pipelineValue,
      revenueWon,
      winRate,
      opportunitiesCount: openOpps.length,
    };
  });
  
  pipelineStages = computed(() => {
    const openOpps = this.filteredOpportunities().filter(o => o.stage !== OpportunityStage.ClosedWon && o.stage !== OpportunityStage.ClosedLost);
    const totalPipelineValue = openOpps.reduce((sum, o) => sum + o.value, 0);

    const stages = Object.values(OpportunityStage)
      .filter(stage => stage !== OpportunityStage.ClosedWon && stage !== OpportunityStage.ClosedLost)
      .map(stage => {
        const valueInStage = openOpps
          .filter(o => o.stage === stage)
          .reduce((sum, o) => sum + o.value, 0);
        return {
          name: stage,
          value: valueInStage,
          percentage: totalPipelineValue > 0 ? (valueInStage / totalPipelineValue) * 100 : 0,
        };
      });
      
    return stages;
  });

  private visibleActivities = computed(() => {
      const userIds = this.getVisibleUserIds();
      return this.dataService.activities().filter(a => userIds.includes(a.ownerId));
  });

  recentActivities = computed(() => {
    return this.visibleActivities()
      .slice()
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  });

  timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  }
}
