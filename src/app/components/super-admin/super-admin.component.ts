import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Company, ServicePlan, SuperAdminView } from '../../models/crm.models';
import { PlanEditorComponent } from './plan-editor.component';

interface Tenant extends Company {
    userCount: number;
    contactCount: number;
    opportunityCount: number;
    mrr: number;
}

@Component({
  selector: 'app-super-admin',
  imports: [CommonModule, PlanEditorComponent],
  template: `
    <div class="min-h-screen bg-gray-900 text-gray-300">
        <!-- Header -->
        <header class="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3.5a1.5 1.5 0 01-3 0V8a1 1 0 00-1-1H3a1 1 0 01-1-1V5a1 1 0 011-1h3.5a1.5 1.5 0 013 0V3.5zM3 11h1.5a1.5 1.5 0 013 0V12a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3.5a1.5 1.5 0 01-3 0V16a1 1 0 00-1-1H3a1 1 0 01-1-1v-2a1 1 0 011-1z" />
                            </svg>
                        </div>
                        <h1 class="text-xl font-bold text-white">Service Provider Dashboard</h1>
                    </div>
                    <button (click)="authService.logout()" class="text-sm font-medium bg-gray-700 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600">Logout</button>
                </div>
                 <div class="border-b border-gray-700">
                    <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                        <button (click)="view.set('dashboard')"
                                class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm"
                                [class]="view() === 'dashboard' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'">
                            Dashboard
                        </button>
                        <button (click)="view.set('plans')"
                                class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm"
                                [class]="view() === 'plans' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'">
                            Plans
                        </button>
                    </nav>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            @switch(view()) {
                @case('dashboard') {
                     <!-- KPIs -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                            <h3 class="text-sm font-medium text-gray-400">Total Tenants</h3>
                            <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().totalTenants }}</p>
                        </div>
                        <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                            <h3 class="text-sm font-medium text-gray-400">Total Users</h3>
                            <p class="text-3xl font-bold text-gray-100 mt-1">{{ kpis().totalUsers }}</p>
                        </div>
                        <div class="bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
                            <h3 class="text-sm font-medium text-gray-400">Total MRR</h3>
                            <p class="text-3xl font-bold text-emerald-400 mt-1">{{ kpis().totalMrr | currency }}</p>
                        </div>
                    </div>

                    <!-- Tenants Table -->
                    <div>
                        <h2 class="text-2xl font-bold text-gray-100 mb-4">Tenant Management</h2>
                        <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
                            <table class="min-w-full">
                                <thead class="bg-gray-900">
                                    <tr>
                                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</th>
                                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacts</th>
                                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Opps</th>
                                        <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">MRR</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-gray-800 divide-y divide-gray-700">
                                    @for(tenant of tenants(); track tenant.id) {
                                        <tr class="hover:bg-gray-700/50">
                                            <td class="px-4 py-3 text-sm font-medium text-gray-100">{{ tenant.name }}</td>
                                            <td class="px-4 py-3 text-sm">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getPlanBadgeClass(tenant.planId)">
                                                    {{ getPlanName(tenant.planId) }}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-sm text-gray-300">{{ tenant.userCount }}</td>
                                            <td class="px-4 py-3 text-sm text-gray-300">{{ tenant.contactCount }}</td>
                                            <td class="px-4 py-3 text-sm text-gray-300">{{ tenant.opportunityCount }}</td>
                                            <td class="px-4 py-3 text-sm font-semibold text-emerald-400">{{ tenant.mrr | currency }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                }
                @case('plans') {
                    <app-plan-editor></app-plan-editor>
                }
            }
        </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminComponent {
  dataService = inject(DataService);
  authService = inject(AuthService);
  
  view = signal<SuperAdminView>('dashboard');

  tenants = computed<Tenant[]>(() => {
    const companies = this.dataService.companies();
    const users = this.dataService.users();
    const contacts = this.dataService.contacts();
    const opportunities = this.dataService.opportunities();

    return companies.map(company => {
        const companyUsers = users.filter(u => u.companyId === company.id);
        const companyContacts = contacts.filter(c => c.companyId === company.id);
        const companyOpps = opportunities.filter(o => o.companyId === company.id);
        const plan = this.dataService.getPlanById(company.planId);
        
        return {
            ...company,
            contactCount: companyContacts.length,
            opportunityCount: companyOpps.length,
            userCount: companyUsers.length,
            mrr: plan?.monthlyPrice || 0
        };
    });
  });

  kpis = computed(() => {
    const allTenants = this.tenants();
    const totalMrr = allTenants.reduce((sum, tenant) => sum + tenant.mrr, 0);

    return {
        totalTenants: allTenants.length,
        totalUsers: this.dataService.users().length,
        totalMrr: totalMrr
    };
  });

  getPlanName(planId: string): string {
    return this.dataService.getPlanById(planId)?.name || 'N/A';
  }

  getPlanBadgeClass(planId: string): string {
    const planName = this.getPlanName(planId);
    switch(planName) {
        case 'Free': return 'bg-gray-500/10 text-gray-300';
        case 'Startup': return 'bg-sky-500/10 text-sky-300';
        case 'Business': return 'bg-indigo-500/10 text-indigo-300';
        default: return 'bg-gray-500/10 text-gray-300';
    }
  }
}