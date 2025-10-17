import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { OpportunityStage, Opportunity } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-opportunities',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Opportunities</h1>
          <div class="flex items-center gap-2">
            <button (click)="uiService.openImportModal('opportunities')" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Import</button>
            <button (click)="uiService.openOpportunityModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">New Opportunity</button>
          </div>
      </div>

      <div class="w-full overflow-x-auto">
        <div class="flex space-x-4 p-2 min-w-max">
            @for(stage of opportunityStages; track stage) {
              <div class="bg-gray-900 rounded-lg w-72 flex-shrink-0">
                  <div class="p-3 font-semibold text-gray-200 border-b border-gray-700">
                      {{ stage }} ({{ opportunitiesByStage()[stage]?.length || 0 }})
                  </div>
                  <div class="p-2 space-y-2 h-[calc(100vh-20rem)] overflow-y-auto">
                      @for(opp of opportunitiesByStage()[stage]; track opp.id) {
                          <div class="bg-gray-800 rounded-md shadow-sm p-3 border border-gray-700 cursor-pointer hover:shadow-md hover:border-indigo-500" (click)="uiService.openOpportunityModal(opp)">
                              <p class="font-semibold text-sm text-gray-100">{{ opp.name }}</p>
                              <p class="text-xs text-gray-400">{{ dataService.getCompanyById(opp.companyId)?.name }}</p>
                              <div class="flex justify-between items-center mt-2">
                                  <p class="text-sm font-bold text-gray-200">{{ opp.value | currency:'USD':'symbol':'1.0-0' }}</p>
                                  <span class="text-xs text-gray-400">{{ opp.closeDate | date:'MMM d' }}</span>
                              </div>
                          </div>
                      }
                      @empty {
                          <div class="p-4 text-center text-sm text-gray-500">No opportunities in this stage.</div>
                      }
                  </div>
              </div>
            }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpportunitiesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  opportunityStages = Object.values(OpportunityStage);

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

  visibleOpportunities = computed(() => this.dataService.opportunities().filter(o => this.getVisibleUserIds().includes(o.ownerId)));
  
  opportunitiesByStage = computed(() => {
    return this.visibleOpportunities().reduce((acc, opp) => {
      if (!acc[opp.stage]) {
        acc[opp.stage] = [];
      }
      acc[opp.stage].push(opp);
      return acc;
    }, {} as { [key in OpportunityStage]?: Opportunity[] });
  });
}