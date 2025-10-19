import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Opportunity, OpportunityStage, User } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';

interface SalesReportKpis {
  totalRevenue: number;
  dealsWon: number;
  averageDealSize: number;
  salesCycleDays: number;
}

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <h1 class="text-3xl font-bold text-gray-100 mb-6">Reports</h1>
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div class="p-4 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-gray-100">Sales Performance</h2>
        </div>
        <div class="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-700 bg-gray-900/50">
          <div>
            <label class="block text-sm font-medium text-gray-400">Date Range</label>
            <select [(ngModel)]="dateRange" class="mt-1 bg-gray-700 text-gray-200 border border-gray-600 rounded-md py-2 px-3 text-sm">
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="365d">Last Year</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400">Sales Rep</label>
            <select [(ngModel)]="selectedOwner" class="mt-1 bg-gray-700 text-gray-200 border border-gray-600 rounded-md py-2 px-3 text-sm">
              <option value="all">All Reps</option>
              @for(user of salesReps(); track user.id) {
                <option [value]="user.id">{{ user.name }}</option>
              }
            </select>
          </div>
        </div>
        
        <div class="p-6">
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-gray-900 p-5 rounded-lg">
                    <h3 class="text-sm font-medium text-gray-400">Total Revenue</h3>
                    <p class="text-3xl font-bold text-emerald-400 mt-1">{{ kpis().totalRevenue | currency }}</p>
                </div>
                <div class="bg-gray-900 p-5 rounded-lg">
                    <h3 class="text-sm font-medium text-gray-400">Deals Won</h3>
                    <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().dealsWon }}</p>
                </div>
                <div class="bg-gray-900 p-5 rounded-lg">
                    <h3 class="text-sm font-medium text-gray-400">Average Deal Size</h3>
                    <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().averageDealSize | currency }}</p>
                </div>
                 <div class="bg-gray-900 p-5 rounded-lg">
                    <h3 class="text-sm font-medium text-gray-400">Avg. Sales Cycle</h3>
                    <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().salesCycleDays | number:'1.0-0' }} days</p>
                </div>
           </div>

           <div class="mt-8">
                <h3 class="text-lg font-semibold text-gray-100 mb-4">Won Opportunities</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-900/50">
                            <tr>
                                <th class="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase">Opportunity</th>
                                <th class="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase">Company</th>
                                <th class="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase">Value</th>
                                <th class="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase">Close Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                            @for(opp of reportData(); track opp.id) {
                                <tr class="hover:bg-gray-700/30">
                                    <td class="px-4 py-3 text-sm font-medium text-gray-100">{{ opp.name }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-300">{{ dataService.getCompanyById(opp.companyId)?.name }}</td>
                                    <td class="px-4 py-3 text-sm font-semibold text-emerald-400">{{ opp.value | currency }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-300">{{ opp.closeDate | date:'mediumDate' }}</td>
                                </tr>
                            }
                            @empty {
                                <tr><td colspan="4" class="text-center py-8 text-gray-500">No data for selected filters.</td></tr>
                            }
                        </tbody>
                    </table>
                </div>
           </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);

  dateRange = 'all';
  selectedOwner = 'all';

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const userRole = this.authService.currentUserRole();
    if (!currentUser || !userRole) return [];
  
    if (userRole.name === 'Admin') {
      return this.dataService.users().map(u => u.id);
    }
    
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

  salesReps = computed<User[]>(() => {
    const userIds = this.getVisibleUserIds();
    const salesRepRoleIds = ['role-2', 'role-3']; // Manager and Sales Rep
    return this.dataService.users().filter(u => userIds.includes(u.id) && salesRepRoleIds.includes(u.roleId));
  });

  reportData = computed<Opportunity[]>(() => {
    let opportunities = this.visibleOpportunities().filter(o => o.stage === OpportunityStage.ClosedWon);

    if (this.selectedOwner !== 'all') {
      opportunities = opportunities.filter(o => o.ownerId === this.selectedOwner);
    }

    if (this.dateRange !== 'all') {
      const days = parseInt(this.dateRange.replace('d', ''));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      opportunities = opportunities.filter(o => new Date(o.closeDate) >= cutoffDate);
    }
    
    return opportunities;
  });

  kpis = computed<SalesReportKpis>(() => {
    const data = this.reportData();
    const dealsWon = data.length;
    const totalRevenue = data.reduce((sum, opp) => sum + opp.value, 0);
    const averageDealSize = dealsWon > 0 ? totalRevenue / dealsWon : 0;

    const totalSalesCycleDays = data.reduce((sum, opp) => {
      const created = new Date(opp.createdAt).getTime();
      const closed = new Date(opp.closeDate).getTime();
      const diffDays = (closed - created) / (1000 * 3600 * 24);
      return sum + (diffDays > 0 ? diffDays : 0);
    }, 0);
    const salesCycleDays = dealsWon > 0 ? totalSalesCycleDays / dealsWon : 0;

    return { totalRevenue, dealsWon, averageDealSize, salesCycleDays };
  });
}
