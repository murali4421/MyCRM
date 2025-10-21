import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { OpportunityStage, Opportunity } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-opportunities',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Opportunities</h1>
          <div class="flex flex-wrap items-center gap-2">
             <input 
              type="text" 
              placeholder="Search opportunities..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('placeholder-text')">
            <button (click)="uiService.openImportModal('opportunities')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Import</button>
            <button 
              (click)="startAdding()" 
              [disabled]="isAdding()" 
              [title]="authService.canAddOpportunity() ? 'Add a new opportunity' : 'Your plan limit has been reached. Please upgrade.'"
              class="px-4 py-2 rounded-md text-sm font-medium disabled:cursor-not-allowed"
              [class.cursor-not-allowed]="!authService.canAddOpportunity()"
              [class]="(authService.canAddOpportunity() ? themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') : themeService.c('bg-disabled')) + ' ' + themeService.c('text-on-accent')">
              Add Opportunity
            </button>
          </div>
      </div>

      <div class="w-full overflow-x-auto">
        <div class="flex space-x-4 p-2 min-w-max">
            @for(stage of opportunityStages; track stage) {
              <div class="rounded-lg w-72 flex-shrink-0 flex flex-col" [class]="themeService.c('bg-base')">
                  <div class="p-3 font-semibold border-b" [class]="themeService.c('text-primary') + ' ' + themeService.c('border-primary')">
                      {{ stage }} ({{ opportunitiesByStage()[stage]?.length || 0 }})
                  </div>
                  <div 
                    class="p-2 space-y-2 flex-1 h-[calc(100vh-20rem)] overflow-y-auto transition-colors"
                    (dragover)="onDragOver($event, stage)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event, stage)"
                    [class]="dragOverStage() === stage ? themeService.c('bg-accent-subtle') : ''"
                  >
                      @if (stage === opportunityStages[0] && isAdding()) {
                        <div class="rounded-md shadow-sm p-3 border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-accent')">
                           <form #newOppForm="ngForm" (ngSubmit)="saveNewOpportunity(newOppForm)" class="space-y-2">
                              <input type="text" name="name" ngModel required placeholder="Opportunity Name" class="w-full border rounded-md px-2 py-1.5 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                              <select name="companyId" ngModel required class="w-full border rounded-md px-2 py-1.5 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                                <option [ngValue]="undefined" disabled>Select Company</option>
                                @for (company of dataService.companies(); track company.id) {
                                  <option [value]="company.id">{{ company.name }}</option>
                                }
                              </select>
                              <input type="number" name="value" ngModel required placeholder="Value" class="w-full border rounded-md px-2 py-1.5 text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('placeholder-text')">
                              <div class="mt-2 flex justify-end gap-2">
                                <button type="button" (click)="cancelAdd()" class="text-sm font-medium px-3 py-1 rounded-md" [class]="themeService.c('text-base') + ' ' + 'hover:text-white'">Cancel</button>
                                <button type="submit" [disabled]="!newOppForm.valid" class="text-sm font-medium px-3 py-1 rounded-md" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled') + ' ' + themeService.c('text-on-accent')">Save</button>
                              </div>
                            </form>
                        </div>
                      }
                      @for(opp of opportunitiesByStage()[stage]; track opp.id) {
                          <div 
                            class="rounded-md shadow-sm p-3 border cursor-pointer" 
                            [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary') + ' ' + 'hover:shadow-md' + ' ' + 'hover:' + themeService.c('border-accent')" 
                            (click)="uiService.openOpportunityModal(opp)"
                            draggable="true"
                            (dragstart)="onDragStart($event, opp.id)"
                           >
                              <p class="font-semibold text-sm" [class]="themeService.c('text-primary')">{{ opp.name }}</p>
                              <p class="text-xs" [class]="themeService.c('text-secondary')">{{ dataService.getCompanyById(opp.companyId)?.name }}</p>
                              <div class="flex justify-between items-center mt-2">
                                  <p class="text-sm font-bold" [class]="themeService.c('text-primary')">{{ opp.value | currency:'USD':'symbol':'1.0-0' }}</p>
                                  <span class="text-xs" [class]="themeService.c('text-secondary')">{{ opp.closeDate | date:'MMM d' }}</span>
                              </div>
                          </div>
                      }
                      @empty {
                        @if (!isAdding() || stage !== opportunityStages[0]) {
                          <div class="p-4 text-center text-sm h-full flex items-center justify-center" [class]="themeService.c('text-tertiary')">
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
  themeService = inject(ThemeService);

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
