import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ServicePlan, ServicePlanFeatures } from '../../models/crm.models';

// FIX: Added missing properties to satisfy the ServicePlanFeatures interface.
const newPlanFeatures: ServicePlanFeatures = {
    taskManagement: true,
    aiAssistant: false,
    auditLog: false,
    projects: false,
    products: false,
    leads: false,
    quotes: false,
    cases: false,
    reports: false,
};

@Component({
  selector: 'app-plan-editor',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      @if (editingPlan(); as plan) {
        <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <h3 class="text-xl font-bold text-gray-100 mb-6">{{ isNew() ? 'Create New Plan' : 'Edit Plan' }}</h3>
            <form #planForm="ngForm" (ngSubmit)="savePlan(planForm)">
                <!-- Basic Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Plan Name</label>
                        <input type="text" name="name" [(ngModel)]="plan.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Default Plan for New Signups</label>
                         <label class="relative inline-flex items-center cursor-pointer mt-2">
                          <input type="checkbox" name="isDefault" [(ngModel)]="plan.isDefault" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>

                <!-- Pricing -->
                <h4 class="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">Pricing (USD)</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Monthly Price</label>
                        <input type="number" name="monthlyPrice" [(ngModel)]="plan.monthlyPrice" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">6-Month Price</label>
                        <input type="number" name="biannualPrice" [(ngModel)]="plan.biannualPrice" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Yearly Price</label>
                        <input type="number" name="yearlyPrice" [(ngModel)]="plan.yearlyPrice" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                </div>

                <!-- Limits -->
                <h4 class="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">Limits (-1 for unlimited)</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-300">User Limit</label>
                        <input type="number" name="userLimit" [(ngModel)]="plan.userLimit" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-300">Company Limit</label>
                        <input type="number" name="companyLimit" [(ngModel)]="plan.companyLimit" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-300">Contact Limit</label>
                        <input type="number" name="contactLimit" [(ngModel)]="plan.contactLimit" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-300">Opportunity Limit</label>
                        <input type="number" name="opportunityLimit" [(ngModel)]="plan.opportunityLimit" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm">
                    </div>
                </div>
                
                 <!-- Features -->
                <h4 class="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">Features</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                    @for(feature of objectKeys(plan.features); track feature) {
                        <label class="flex items-center space-x-3 bg-gray-700/50 p-3 rounded-md">
                            <input type="checkbox" name="feature_{{feature}}" [(ngModel)]="plan.features[feature]" class="h-4 w-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500">
                            <span class="text-sm font-medium text-gray-200">{{ feature | titlecase }}</span>
                        </label>
                    }
                </div>
                
                <div class="mt-8 pt-6 border-t border-gray-700 flex justify-end gap-2">
                    <button type="button" (click)="closeEditor()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                    <button type="submit" [disabled]="!planForm.valid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Plan</button>
                </div>
            </form>
        </div>
      } @else {
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-100">Manage Service Plans</h2>
            <button (click)="openEditor(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">Create New Plan</button>
        </div>
         <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
            <table class="min-w-full">
                <thead class="bg-gray-900">
                    <tr>
                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Monthly Price</th>
                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Default</th>
                        <th class="px-4 py-3 border-b border-gray-700"></th>
                    </tr>
                </thead>
                <tbody class="bg-gray-800 divide-y divide-gray-700">
                    @for(plan of plans(); track plan.id) {
                        <tr class="hover:bg-gray-700/50">
                            <td class="px-4 py-3 text-sm font-medium text-gray-100">{{ plan.name }}</td>
                            <td class="px-4 py-3 text-sm text-emerald-400 font-semibold">{{ plan.monthlyPrice | currency }}</td>
                            <td class="px-4 py-3 text-sm text-gray-300">{{ plan.userLimit === -1 ? 'Unlimited' : plan.userLimit }}</td>
                            <td class="px-4 py-3 text-sm text-gray-300">
                                @if(plan.isDefault) {
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300">Yes</span>
                                }
                            </td>
                            <td class="px-4 py-3 text-sm text-right">
                                <button (click)="openEditor(plan)" class="text-indigo-400 hover:text-indigo-300 font-medium mr-4">Edit</button>
                                <button (click)="deletePlan(plan.id)" [disabled]="plan.isDefault" class="text-red-500 hover:text-red-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanEditorComponent {
  dataService = inject(DataService);

  plans = this.dataService.servicePlans;
  editingPlan = signal<ServicePlan | null>(null);
  isNew = signal(false);

  // Helper for iterating over object keys in the template
  objectKeys = Object.keys as <T>(obj: T) => Array<keyof T>;

  openEditor(plan: ServicePlan | null) {
    if (plan) {
        // Deep copy to avoid mutating the signal directly
        this.editingPlan.set(JSON.parse(JSON.stringify(plan)));
        this.isNew.set(false);
    } else {
        this.editingPlan.set({
            id: `plan-${Date.now()}`,
            name: '',
            monthlyPrice: 0,
            biannualPrice: 0,
            yearlyPrice: 0,
            userLimit: 1,
            companyLimit: 1,
            contactLimit: 1,
            opportunityLimit: 1,
            features: { ...newPlanFeatures },
            isDefault: false,
        });
        this.isNew.set(true);
    }
  }

  closeEditor() {
    this.editingPlan.set(null);
  }

  private async ensureSingleDefaultPlan(newDefaultPlan: ServicePlan) {
    if (!newDefaultPlan.isDefault) {
      return; // If the current plan isn't default, there's nothing to do.
    }

    // Create a list of promises to update other default plans.
    const updatePromises = this.plans()
      .filter(plan => plan.id !== newDefaultPlan.id && plan.isDefault)
      .map(planToUpdate => this.dataService.updateServicePlan({ ...planToUpdate, isDefault: false }));
    
    // Wait for all other plans to be updated before proceeding.
    await Promise.all(updatePromises);
  }

  async savePlan(form: NgForm) {
    if (!form.valid || !this.editingPlan()) return;
    
    const planToSave = this.editingPlan()!;

    // Ensure that if this plan is set to default, any other default plan is unset.
    await this.ensureSingleDefaultPlan(planToSave);

    if (this.isNew()) {
        await this.dataService.addServicePlan(planToSave);
    } else {
        await this.dataService.updateServicePlan(planToSave);
    }
    this.closeEditor();
  }

  async deletePlan(planId: string) {
    const companiesOnPlan = this.dataService.companies().filter(c => c.planId === planId);
    if (companiesOnPlan.length > 0) {
        alert(`Cannot delete this plan. It is currently assigned to ${companiesOnPlan.length} tenant(s).`);
        return;
    }

    if (confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
        await this.dataService.deleteServicePlan(planId);
    }
  }
}
