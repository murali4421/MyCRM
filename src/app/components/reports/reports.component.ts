import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Opportunity, OpportunityStage, User } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

interface SalesReportKpis {
  totalRevenue: number;
  dealsWon: number;
  averageDealSize: number;
  salesCycleDays: number;
}

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div>
      <h1 class="text-3xl font-bold mb-6" [class]="themeService.c('text-primary')">Reports</h1>
      <div class="rounded-lg shadow-sm border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <div class="p-4 border-b" [class]="themeService.c('border-primary')">
          <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Sales Performance</h2>
        </div>
        <div class="p-4 flex flex-col sm:flex-row gap-4 border-b" [class]="themeService.c('border-primary') + ' ' + themeService.c('bg-base')">
          <div>
            <label class="block text-sm font-medium" [class]="themeService.c('text-secondary')">Date Range</label>
            <select [(ngModel)]="dateRange" class="mt-1 border rounded-md py-2 px-3 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="365d">Last Year</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium" [class]="themeService.c('text-secondary')">Sales Rep</label>
            <select [(ngModel)]="selectedOwner" class="mt-1 border rounded-md py-2 px-3 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              <option value="all">All Reps</option>
              @for(user of salesReps(); track user.id) {
                <option [value]="user.id">{{ user.name }}</option>
              }
            </select>
          </div>
        </div>
        
        <div class="p-6">
           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="p-5 rounded-lg" [class]="themeService.c('bg-base')">
                    <h3 class="text-sm font-medium" [class]="themeService.c('text-secondary')">Total Revenue</h3>
                    <p class="text-3xl font-bold mt-1" [class]="themeService.c('text-success')">{{ kpis().totalRevenue | currency }}</p>
                </div>
                <div class="p-5 rounded-lg" [class]="themeService.c('bg-base')">
                    <h3 class="text-sm font-medium" [class]="themeService.c('text-secondary')">Deals Won</h3>
                    <p class="text-3xl font-bold mt-1" [class]="themeService.c('text-primary')">{{ kpis().dealsWon }}</p>
                </div>
                <div class="p-5 rounded-lg" [class]="themeService.c('bg-base')">
                    <h3 class="text-sm font-medium" [class]="themeService.c('text-secondary')">Average Deal Size</h3>
                    <p class="text-3xl font-bold mt-1" [class]="themeService.c('text-primary')">{{ kpis().averageDealSize | currency }}</p>
                </div>
                 <div class="p-5 rounded-lg" [class]="themeService.c('bg-base')">
                    <h3 class="text-sm font-medium" [class]="themeService.c('text-secondary')">Avg. Sales Cycle</h3>
                    <p class="text-3xl font-bold mt-1" [class]="themeService.c('text-primary')">{{ kpis().salesCycleDays | number:'1.0-0' }} days</p>
                </div>
           </div>

           <div class="mt-8">
                <h3 class="text-lg font-semibold mb-4" [class]="themeService.c('text-primary')">Won Opportunities</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead [class]="themeService.c('bg-base')">
                            <tr>
                                <th class="px-4 py-2 border-b-2 text-left text-xs font-semibold uppercase" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Opportunity</th>
                                <th class="px-4 py-2 border-b-2 text-left text-xs font-semibold uppercase" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Company</th>
                                <th class="px-4 py-2 border-b-2 text-left text-xs font-semibold uppercase" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Value</th>
                                <th class="px-4 py-2 border-b-2 text-left text-xs font-semibold uppercase" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">Close Date</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y" [class]="themeService.c('border-primary')">
                            @for(opp of reportData(); track opp.id) {
                                <tr [class]="themeService.c('bg-primary-hover-subtle')">
                                    <td class="px-4 py-3 text-sm font-medium" [class]="themeService.c('text-primary')">{{ opp.name }}</td>
                                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ dataService.getCompanyById(opp.companyId)?.name }}</td>
                                    <td class="px-4 py-3 text-sm font-semibold" [class]="themeService.c('text-success')">{{ opp.value | currency }}</td>
                                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ opp.closeDate | date:'mediumDate' }}</td>
                                </tr>
                            }
                            @empty {
                                <tr><td colspan="4" class="text-center py-8" [class]="themeService.c('text-tertiary')">No data for selected filters.</td></tr>
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
  themeService = inject(ThemeService);

  dateRange = 'all';
  selectedOwner = 'all';

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