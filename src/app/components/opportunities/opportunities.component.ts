import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
          <div class="flex flex-wrap items-center gap-2">
             <input 
              type="text" 
              placeholder="Search opportunities..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto">
            <button (click)="uiService.openImportModal('opportunities')" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Import</button>
            <button 
              (click)="startAdding()" 
              [disabled]="isAdding() || !authService.canAddOpportunity()" 
              [title]="authService.canAddOpportunity() ? 'Add a new opportunity' : 'Your plan limit has been reached. Please upgrade.'"
              class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600 disabled:cursor-not-allowed">
              Add Opportunity
            </button>
          </div>
      </div>

      <div class="w-full overflow-x-auto">
        <div class="flex space-x-4 p-2 min-w-max">
            @for(stage of opportunityStages; track stage) {
              <div class="bg-gray-900 rounded-lg w-72 flex-shrink-0 flex flex-col">
                  <div class="p-3 font-semibold text-gray-200 border-b border-gray-700">
                      {{ stage }} ({{ opportunitiesByStage()[stage]?.length || 0 }})
                  </div>
                  <div 
                    class="p-2 space-y-2 flex-1 h-[calc(100vh-20rem)] overflow-y-auto transition-colors"
                    (dragover)="onDragOver($event, stage)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event, stage)"
                    [class.bg-gray-700/50]="dragOverStage() === stage"
                  >
                      @if (stage === opportunityStages[0] && isAdding()) {
                        <div class="bg-gray-800 rounded-md shadow-sm p-3 border border-indigo-500">
                           <form #newOppForm="ngForm" (ngSubmit)="saveNewOpportunity(newOppForm)" class="space-y-2">
                              <input type="text" name="name" ngModel required placeholder="Opportunity Name" class="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md px-2 py-1.5 text-sm">
                              <select name="companyId" ngModel required class="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md px-2 py-1.5 text-sm">
                                <option [ngValue]="undefined" disabled>Select Company</option>
                                @for (company of dataService.companies(); track company.id) {
                                  <option [value]="company.id">{{ company.name }}</option>
                                }
                              </select>
                              <input type="number" name="value" ngModel required placeholder="Value" class="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded-md px-2 py-1.5 text-sm">
                              <div class="mt-2 flex justify-end gap-2">
                                <button type="button" (click)="cancelAdd()" class="text-sm font-medium text-gray-300 hover:text-white px-3 py-1 rounded-md">Cancel</button>
                                <button type="submit" [disabled]="!newOppForm.valid" class="text-sm font-medium bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:bg-gray-600">Save</button>
                              </div>
                            </form>
                        </div>
                      }
                      @for(opp of opportunitiesByStage()[stage]; track opp.id) {
                          <div 
                            class="bg-gray-800 rounded-md shadow-sm p-3 border border-gray-700 cursor-pointer hover:shadow-md hover:border-indigo-500" 
                            (click)="uiService.openOpportunityModal(opp)"
                            draggable="true"
                            (dragstart)="onDragStart($event, opp.id)"
                           >
                              <p class="font-semibold text-sm text-gray-100">{{ opp.name }}</p>
                              <p class="text-xs text-gray-400">{{ dataService.getCompanyById(opp.companyId)?.name }}</p>
                              <div class="flex justify-between items-center mt-2">
                                  <p class="text-sm font-bold text-gray-200">{{ opp.value | currency:'USD':'symbol':'1.0-0' }}</p>
                                  <span class="text-xs text-gray-400">{{ opp.closeDate | date:'MMM d' }}</span>
                              </div>
                          </div>
                      }
                      @empty {
                        @if (!isAdding() || stage !== opportunityStages[0]) {
                          <div class="p-4 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                            @if (dragOverStage() === stage) {
                                <span>Drop here</span>
                            } @else {
                                <span>No opportunities</span>
                            }
                          </div>
                        }
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

  searchTerm = signal('');
  draggedOpportunityId = signal<string | null>(null);
  dragOverStage = signal<OpportunityStage | null>(null);
  opportunityStages = Object.values(OpportunityStage);
  isAdding = signal(false);

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
  
  filteredOpportunities = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleOpportunities().filter(opp => opp.name.toLowerCase().includes(term));
  });
  
  opportunitiesByStage = computed(() => {
    return this.filteredOpportunities().reduce<{[key in OpportunityStage]?: Opportunity[]}>((acc, opp) => {
      if (!acc[opp.stage]) {
        acc[opp.stage] = [];
      }
      acc[opp.stage]!.push(opp);
      return acc;
    }, {});
  });

  onDragStart(event: DragEvent, oppId: string) {
    this.draggedOpportunityId.set(oppId);
    event.dataTransfer?.setData('text/plain', oppId);
  }

  onDragOver(event: DragEvent, stage: OpportunityStage) {
    event.preventDefault();
    this.dragOverStage.set(stage);
  }

  onDragLeave(event: DragEvent) {
    this.dragOverStage.set(null);
  }

  onDrop(event: DragEvent, stage: OpportunityStage) {
    event.preventDefault();
    const oppId = this.draggedOpportunityId();
    if (oppId) {
      const opportunity = this.dataService.opportunities().find(o => o.id === oppId);
      if (opportunity && opportunity.stage !== stage) {
        this.dataService.updateOpportunity({ ...opportunity, stage });
      }
    }
    this.draggedOpportunityId.set(null);
    this.dragOverStage.set(null);
  }

  startAdding() {
    if (!this.authService.canAddOpportunity()) {
        const limit = this.authService.limitFor('opportunity')();
        this.uiService.openUpgradeModal(`You have reached your plan's limit of ${limit} opportunities. Please upgrade to add more.`);
        return;
    }
    this.isAdding.set(true);
  }

  cancelAdd() {
    this.isAdding.set(false);
  }

  async saveNewOpportunity(form: NgForm) {
    if (form.invalid) return;

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      name: form.value.name,
      companyId: form.value.companyId,
      stage: OpportunityStage.Prospecting,
      value: form.value.value,
      closeDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // Default to 1 month from now
      ownerId: this.authService.currentUser()!.id,
      createdAt: new Date().toISOString(),
    };

    await this.dataService.addOpportunity(newOpp);
    this.isAdding.set(false);
  }
}
