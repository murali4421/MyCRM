import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { OpportunityStage, AppView, Contact, Opportunity, Task, Activity, User } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div class="flex items-center space-x-2">
            <h1 class="text-3xl font-bold text-gray-100">Dashboard</h1>
            @if (lastRefreshed()) {
              <div class="flex items-center text-xs text-gray-400 pt-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1 animate-spin" style="animation-duration: 2000ms;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 9a9 9 0 0114.65-4.65l1.35 1.35M20 15a9 9 0 01-14.65 4.65l-1.35-1.35" />
                </svg>
                <span>Last updated: {{ lastRefreshed() | date:'mediumTime' }}</span>
              </div>
            }
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <!-- Date Filter -->
              <div class="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-md p-1 text-sm">
                  <button (click)="dashboardDateFilter.set('7d')" [class]="dashboardDateFilter() === '7d' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-300'" class="px-2 py-1 rounded-md hover:bg-gray-700">7D</button>
                  <button (click)="dashboardDateFilter.set('30d')" [class]="dashboardDateFilter() === '30d' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-300'" class="px-2 py-1 rounded-md hover:bg-gray-700">30D</button>
                  <button (click)="dashboardDateFilter.set('90d')" [class]="dashboardDateFilter() === '90d' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-300'" class="px-2 py-1 rounded-md hover:bg-gray-700">90D</button>
                  <button (click)="dashboardDateFilter.set('all')" [class]="dashboardDateFilter() === 'all' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-300'" class="px-2 py-1 rounded-md hover:bg-gray-700">All</button>
              </div>
              <!-- Owner Filter -->
              <select [ngModel]="dashboardOwnerFilter()" (ngModelChange)="dashboardOwnerFilter.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                  <option value="all">All Owners</option>
                  @for(user of dataService.users(); track user.id) {
                      <option [value]="user.id">{{user.name}}</option>
                  }
              </select>
          </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div class="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 cursor-pointer hover:shadow-md transition-shadow" (click)="navigateToFilteredView('open_opps')">
              <h3 class="text-sm font-medium text-gray-400">Open Opportunities</h3>
              <p class="text-3xl font-bold text-gray-100">{{ kpiOpenOpportunities().count }}</p>
          </div>
          <div class="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 cursor-pointer hover:shadow-md transition-shadow" (click)="navigateToFilteredView('pipeline_value')">
              <h3 class="text-sm font-medium text-gray-400">Total Pipeline Value</h3>
              <p class="text-3xl font-bold text-gray-100">{{ kpiOpenOpportunities().value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</p>
          </div>
          <div class="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 cursor-pointer hover:shadow-md transition-shadow" (click)="navigateToFilteredView('win_loss')">
              <h3 class="text-sm font-medium text-gray-400">Win / Loss Ratio</h3>
              <p class="text-3xl font-bold text-gray-100">{{ kpiWinLossRatio() }}</p>
          </div>
          <div class="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 cursor-pointer hover:shadow-md transition-shadow" (click)="navigateToFilteredView('new_contacts')">
              <h3 class="text-sm font-medium text-gray-400">Contacts Added</h3>
              <p class="text-3xl font-bold text-gray-100">{{ kpiContactsAdded() }}</p>
          </div>
          <div class="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 cursor-pointer hover:shadow-md transition-shadow" (click)="navigateToFilteredView('tasks_due')">
              <h3 class="text-sm font-medium text-gray-400">Tasks Due Today</h3>
              <p class="text-3xl font-bold text-gray-100">{{ kpiTasksDueToday() }}</p>
          </div>
      </div>

      <!-- Charts and Task List -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Pipeline Funnel -->
              <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h3 class="font-semibold text-lg mb-4 text-gray-100">Pipeline Funnel</h3>
                  <div class="space-y-2">
                      @for (stage of pipelineFunnelData(); track stage.name) {
                          <div class="flex items-center">
                              <div class="w-28 text-sm text-gray-300 text-right pr-4">{{ stage.name }}</div>
                              <div class="flex-1 bg-gray-700 rounded-full h-6">
                                  <div [style.width.%]="stage.percentage" class="bg-cyan-500 h-6 rounded-full flex items-center justify-between px-2 text-white text-xs font-bold">
                                      <span>{{ stage.count }}</span>
                                      <span>{{ stage.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}</span>
                                  </div>
                              </div>
                          </div>
                      }
                  </div>
              </div>
              <!-- Deals by Stage Bar Chart -->
              <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                  <h3 class="font-semibold text-lg mb-4 text-gray-100">Deals Value by Stage</h3>
                  <div class="flex justify-around items-end h-64 space-x-2">
                      @for (stage of dealsByStageData(); track stage.name) {
                          <div class="flex flex-col items-center flex-1">
                              <div class="text-xs text-gray-400">{{ (stage.value / 1000).toFixed(0) }}k</div>
                              <div class="w-full rounded-t-md" [class]="stage.color" [style.height.%]="stage.percentage" title="{{ stage.name }}: {{ stage.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}"></div>
                              <div class="text-xs font-medium text-gray-300 mt-1 text-center">{{ stage.name }}</div>
                          </div>
                      } @empty {
                          <p class="text-sm text-gray-400 w-full text-center self-center">No opportunity data for this period.</p>
                      }
                  </div>
              </div>
          </div>

          <!-- Tasks Due Today -->
          <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
              <h3 class="font-semibold text-lg mb-4 text-gray-100">Tasks Due Today</h3>
              <ul class="space-y-3">
                  @for (task of dashboardTasks(); track task.id) {
                      <li class="flex items-center space-x-3">
                          <input type="checkbox" (change)="dataService.toggleTaskCompleted(task.id)" class="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-500 rounded focus:ring-indigo-500">
                          <div class="flex-1">
                              <p class="text-sm font-medium text-gray-100">{{ task.title }}</p>
                              <p class="text-xs text-gray-400">Owner: {{ dataService.getUserById(task.ownerId)?.name }}</p>
                          </div>
                      </li>
                  }
                  @empty {
                    <p class="text-sm text-gray-400">No tasks due today.</p>
                  }
              </ul>
          </div>
      </div>

      <!-- New Row for Additional Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <!-- Monthly Revenue Chart -->
          <div class="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
              <h3 class="font-semibold text-lg mb-4 text-gray-100">Monthly Revenue (Closed Won)</h3>
              <div class="flex justify-around items-end h-64 space-x-2">
                  @for (month of monthlyRevenueData(); track month.label) {
                      <div class="flex flex-col items-center flex-1">
                          <div class="text-xs text-gray-400">{{ (month.value / 1000).toFixed(0) }}k</div>
                          <div class="w-full bg-emerald-500 rounded-t-md" [style.height.%]="month.percentage" title="{{ month.label }}: {{ month.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}"></div>
                          <div class="text-xs font-medium text-gray-300 mt-1 text-center">{{ month.label }}</div>
                      </div>
                  }
                  @empty {
                      <p class="text-sm text-gray-400 w-full text-center self-center">No revenue data for this period.</p>
                  }
              </div>
          </div>

          <!-- Activity & Leaderboard Column -->
          <div class="space-y-6">
            <!-- Activity Breakdown -->
            <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                <h3 class="font-semibold text-lg mb-4 text-gray-100">Activity Breakdown</h3>
                <div class="space-y-4">
                    @for(activity of activityBreakdownData(); track activity.type) {
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-gray-200">{{activity.type}}</span>
                                <span class="text-sm font-medium text-gray-400">{{activity.count}} ({{activity.percentage.toFixed(0)}}%)</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-2.5">
                                <div class="h-2.5 rounded-full" [class]="activity.color" [style.width.%]="activity.percentage"></div>
                            </div>
                        </div>
                    }
                      @empty {
                        <p class="text-sm text-gray-400">No activity data for this period.</p>
                    }
                </div>
            </div>

            <!-- Sales Leaderboard -->
            <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                <h3 class="font-semibold text-lg mb-4 text-gray-100">Sales Leaderboard</h3>
                <ul class="space-y-4">
                    @for (leader of salesLeaderboardData(); track leader.ownerId; let i = $index) {
                        <li class="flex items-center space-x-3">
                            <span class="text-lg font-bold w-6 text-center" [class.text-amber-300]="i === 0" [class.text-slate-300]="i === 1" [class.text-orange-400]="i === 2" [class.text-gray-400]="i > 2">{{ i + 1 }}</span>
                            <img [src]="leader.profilePictureUrl" [alt]="leader.name" class="w-10 h-10 rounded-full">
                            <div class="flex-1">
                                <p class="font-medium text-gray-100">{{ leader.name }}</p>
                                <p class="text-sm text-gray-400">{{ leader.dealsWon }} deals won</p>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-lg text-emerald-400">{{ leader.totalValue | currency:'USD':'symbol':'1.0-0' }}</p>
                            </div>
                        </li>
                    } @empty {
                        <p class="text-sm text-gray-400">No sales data for this period.</p>
                    }
                </ul>
            </div>
          </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit, OnDestroy {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  
  // Dashboard Filter State
  dashboardDateFilter = signal<'7d' | '30d' | '90d' | 'all'>('30d');
  dashboardOwnerFilter = signal<string>('all');
  lastRefreshed = signal<Date | null>(null);
  private refreshInterval: any;

  private openOpportunityStages = [
    OpportunityStage.Prospecting,
    OpportunityStage.Qualification,
    OpportunityStage.Proposal,
    OpportunityStage.Negotiation
  ];

  ngOnInit(): void {
    this.lastRefreshed.set(new Date());
    this.refreshInterval = setInterval(() => {
      this.lastRefreshed.set(new Date());
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // --- ROLE-BASED VISIBILITY ---
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
  visibleOpportunities = computed(() => this.dataService.opportunities().filter(o => this.getVisibleUserIds().includes(o.ownerId)));
  visibleTasks = computed(() => this.dataService.tasks().filter(t => this.getVisibleUserIds().includes(t.ownerId)));
  visibleActivities = computed(() => this.dataService.activities().filter(a => this.getVisibleUserIds().includes(a.ownerId)));

  // --- COMPUTED SIGNALS FOR DASHBOARD ---
  private getDashboardFilteredData<T extends { ownerId: string }>(dataSet: T[]): T[] {
    const now = new Date();
    const dateFilter = this.dashboardDateFilter();
    let startDate: Date | null = null;
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter.replace('d', ''), 10);
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    
    let filtered = dataSet;
    if (startDate) {
      filtered = filtered.filter(item => {
        // Use a type assertion to safely access properties that only exist on some of the types.
        const itemWithDate = item as { createdAt?: string; startTime?: string };
        const dateString = itemWithDate.createdAt ?? itemWithDate.startTime;
        if (!dateString) return false;
        return new Date(dateString).getTime() >= startDate!.getTime();
      });
    }
    if (this.dashboardOwnerFilter() !== 'all') {
      filtered = filtered.filter(item => item.ownerId === this.dashboardOwnerFilter());
    }
    return filtered;
  }
  
  dashboardFilteredOpps = computed(() => this.getDashboardFilteredData(this.visibleOpportunities()));
  dashboardFilteredContacts = computed(() => this.getDashboardFilteredData(this.visibleContacts()));
  dashboardFilteredActivities = computed(() => this.getDashboardFilteredData(this.visibleActivities()));

  kpiOpenOpportunities = computed(() => {
    const openOpps = this.dashboardFilteredOpps().filter(o => o.stage !== OpportunityStage.ClosedWon && o.stage !== OpportunityStage.ClosedLost);
    return { count: openOpps.length, value: openOpps.reduce((sum, o) => sum + o.value, 0) };
  });

  kpiWinLossRatio = computed(() => {
    const opps = this.dashboardFilteredOpps();
    const wins = opps.filter(o => o.stage === OpportunityStage.ClosedWon).length;
    const losses = opps.filter(o => o.stage === OpportunityStage.ClosedLost).length;
    if (losses === 0) return wins > 0 ? `${wins} / 0` : 'N/A';
    return `${wins} / ${losses}`;
  });

  kpiContactsAdded = computed(() => this.dashboardFilteredContacts().length);

  kpiTasksDueToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    let tasks = this.visibleTasks();
    if (this.dashboardOwnerFilter() !== 'all') {
      tasks = tasks.filter(item => item.ownerId === this.dashboardOwnerFilter());
    }
    return tasks.filter(t => t.dueDate === today && !t.completed).length;
  });

  pipelineFunnelData = computed(() => {
    const openOpps = this.dashboardFilteredOpps().filter(o => this.openOpportunityStages.includes(o.stage));
    const totalValue = openOpps.reduce((acc, o) => acc + o.value, 0) || 1;

    const valueAndCountByStage = openOpps.reduce<{[key in OpportunityStage]?: { value: number, count: number }}>((acc, opp) => {
        if (!acc[opp.stage]) {
            acc[opp.stage] = { value: 0, count: 0 };
        }
        acc[opp.stage]!.value += opp.value;
        acc[opp.stage]!.count += 1;
        return acc;
    }, {});

    return this.openOpportunityStages.map(stage => {
      const stageData = valueAndCountByStage[stage] || { value: 0, count: 0 };
      return { 
          name: stage, 
          count: stageData.count, 
          value: stageData.value, 
          percentage: (stageData.value / totalValue) * 100 
        };
    });
  });

  dealsByStageData = computed(() => {
    const allFilteredOpps = this.dashboardFilteredOpps();
    
    if (allFilteredOpps.length === 0) {
      return [];
    }
    
    const valueByStage = allFilteredOpps.reduce<{[key in OpportunityStage]?: number}>((acc, opp) => {
        acc[opp.stage] = (acc[opp.stage] || 0) + opp.value;
        return acc;
    }, {});

    const allStages = Object.values(OpportunityStage);
    
    const dataWithValues = allStages
      .map(stage => ({
        name: stage,
        value: valueByStage[stage] || 0
      }))
      .filter(d => d.value > 0); 

    if (dataWithValues.length === 0) {
        return [];
    }

    const maxValue = Math.max(...dataWithValues.map(d => d.value), 1);
    
    const getColorForStage = (stageName: OpportunityStage): string => {
        switch(stageName) {
            case OpportunityStage.ClosedWon: return 'bg-emerald-500';
            case OpportunityStage.ClosedLost: return 'bg-rose-500';
            default: return 'bg-sky-500';
        }
    }

    return dataWithValues.map(d => ({ 
        ...d, 
        percentage: (d.value / maxValue) * 100,
        color: getColorForStage(d.name as OpportunityStage)
    }));
  });

  dashboardTasks = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.visibleTasks().filter(t => t.dueDate === today && !t.completed && (this.dashboardOwnerFilter() === 'all' || t.ownerId === this.dashboardOwnerFilter()));
  });

  monthlyRevenueData = computed(() => {
    let opps = this.visibleOpportunities().filter(o => o.stage === OpportunityStage.ClosedWon);
    if (this.dashboardOwnerFilter() !== 'all') {
      opps = opps.filter(item => item.ownerId === this.dashboardOwnerFilter());
    }

    const dataByMonth: { [key: string]: number } = {};
    const months: { label: string, key: string }[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            label: d.toLocaleString('default', { month: 'short' }),
            key: `${d.getFullYear()}-${d.getMonth()}`
        });
    }

    months.forEach(m => dataByMonth[m.key] = 0);

    opps.forEach(opp => {
        const closeDate = new Date(opp.closeDate.replace(/-/g, '/'));
        const key = `${closeDate.getFullYear()}-${closeDate.getMonth()}`;
        if (key in dataByMonth) {
            // FIX: The left-hand side of an arithmetic operation must be a number.
            // `dataByMonth[key]` could be treated as `number | undefined`, so `|| 0` ensures it's a number.
            dataByMonth[key] = (dataByMonth[key] || 0) + opp.value;
        }
    });

    const data = months.map(m => ({ label: m.label, value: dataByMonth[m.key] || 0 }));
    if (data.every(d => d.value === 0)) return [];
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return data.map(d => ({ ...d, percentage: (d.value / maxValue) * 100 }));
  });

  activityBreakdownData = computed(() => {
    const activities = this.dashboardFilteredActivities();
    if (!activities.length) return [];
    const total = activities.length || 1;
    const breakdown = activities.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});
    const colors: { [key: string]: string } = { 'Call summary': 'bg-amber-400', 'Email': 'bg-sky-400', 'Meeting': 'bg-violet-400', 'Note': 'bg-slate-400' };
    return Object.entries(breakdown).map(([type, count]) => ({ type, count, percentage: (count / total) * 100, color: colors[type] }));
  });

  salesLeaderboardData = computed(() => {
    const opps = this.dashboardFilteredOpps().filter(o => o.stage === OpportunityStage.ClosedWon);
    if (!opps.length) return [];
  
    const valueByOwner = opps.reduce<{[key: string]: { totalValue: number, dealsWon: number }}>((acc, opp) => {
        if (!acc[opp.ownerId]) {
            acc[opp.ownerId] = { totalValue: 0, dealsWon: 0 };
        }
        acc[opp.ownerId].totalValue += opp.value;
        acc[opp.ownerId].dealsWon += 1;
        return acc;
    }, {});
  
    const allUsers = this.dataService.users();
  
    // FIX: Avoid spreading a potentially undefined result from `.find()`, which would cause a runtime error.
    // Instead, find the user first, and if they exist, construct the leaderboard entry.
    // Then, filter out any null results for users that might not have been found.
    return Object.entries(valueByOwner)
        .map(([ownerId, data]) => {
            const user = allUsers.find(u => u.id === ownerId);
            if (user) {
              return {
                  ...data,
                  ownerId,
                  name: user.name,
                  profilePictureUrl: user.profilePictureUrl
              };
            }
            return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) // Type guard to remove nulls
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5); // Top 5
  });

  navigateToFilteredView(kpi: string) {
    const viewMap: {[key:string]: AppView} = { open_opps: 'opportunities', pipeline_value: 'opportunities', win_loss: 'opportunities', new_contacts: 'contacts', tasks_due: 'tasks' };
    if(viewMap[kpi]) this.uiService.changeView(viewMap[kpi]);
  }
}
