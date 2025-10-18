import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Company, User, ServicePlan, ServicePlanFeatures, AppView } from '../models/crm.models';
import { UiService } from './ui.service';
import { LoggingService } from './logging.service';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private uiService = inject(UiService);
  private loggingService = inject(LoggingService);
  private injector = inject(Injector);

  private _dataService: DataService | undefined;
  private get dataService(): DataService {
    if (!this._dataService) {
      this._dataService = this.injector.get(DataService);
    }
    return this._dataService;
  }

  // In a real app, this would be null until a user logs in.
  // We'll mock a logged-in user for demonstration.
  currentUser = signal<User | null>(null);
  loginAs = signal<'crm' | 'superadmin' | null>(null);

  isAuthenticated = computed(() => !!this.currentUser());
  authError = signal<string | null>(null);
  passwordStrength = signal(0);

  currentCompany = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    // In a multi-tenant app with proper data segregation, this would be an API call.
    // Here we find the company from the global list.
    return this.dataService.companies().find(c => c.id === user.companyId);
  });
  
  currentPlan = computed<ServicePlan | null>(() => {
      const company = this.currentCompany();
      if (!company) return null;
      const plan = this.dataService.getPlanById(company.planId);
      return plan || null;
  });

  isPlanExpired = computed(() => {
    const company = this.currentCompany();
    if (!company || !company.expiryDate) {
        return false;
    }
    const expiry = new Date(company.expiryDate);
    const now = new Date();
    return expiry < now;
  });
  
  isFeatureEnabled = (feature: keyof ServicePlanFeatures) => computed(() => {
    if (this.loginAs() === 'superadmin') return true;
    const plan = this.currentPlan();
    if (!plan) return false;
    return plan.features[feature];
  });

  private tenantUsage = computed(() => {
    // In a real multi-tenant app, these would be fetched for the specific tenant.
    // Here, we assume the global data service lists are scoped to the current tenant.
    return {
        users: this.dataService.users().length,
        contacts: this.dataService.contacts().length,
        companies: this.dataService.companies().length,
        opportunities: this.dataService.opportunities().length,
    };
  });

  canAddUser = computed(() => {
    const plan = this.currentPlan();
    if (!plan || plan.userLimit === -1) return true;
    return this.tenantUsage().users < plan.userLimit;
  });
  
  canAddCompany = computed(() => {
    const plan = this.currentPlan();
    if (!plan || plan.companyLimit === -1) return true;
    return this.tenantUsage().companies < plan.companyLimit;
  });

  canAddContact = computed(() => {
    const plan = this.currentPlan();
    if (!plan || plan.contactLimit === -1) return true;
    return this.tenantUsage().contacts < plan.contactLimit;
  });

  canAddOpportunity = computed(() => {
    const plan = this.currentPlan();
    if (!plan || plan.opportunityLimit === -1) return true;
    return this.tenantUsage().opportunities < plan.opportunityLimit;
  });

  limitFor = (entity: 'user' | 'contact' | 'company' | 'opportunity') => computed(() => {
    const plan = this.currentPlan();
    if (!plan) return 0;
    switch(entity) {
        case 'user': return plan.userLimit;
        case 'contact': return plan.contactLimit;
        case 'company': return plan.companyLimit;
        case 'opportunity': return plan.opportunityLimit;
        default: return 0;
    }
  });

  // --- Centralized Role & Permission Logic ---
  currentUserRole = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return this.dataService.getRoleById(user.roleId);
  });
  
  isCurrentUserAdmin = computed(() => this.currentUserRole()?.name === 'Admin');
  
  isCurrentUserAdminOrManager = computed(() => {
    const roleName = this.currentUserRole()?.name;
    return roleName === 'Admin' || roleName === 'Manager';
  });

  isViewAllowed(view: AppView): boolean {
    switch (view) {
      case 'projects':
        return this.isFeatureEnabled('projects')();
      case 'products':
        return this.isFeatureEnabled('products')();
      case 'tasks':
        return this.isFeatureEnabled('taskManagement')();
      case 'audit-log':
        // Requires both Admin role and feature flag
        return this.isCurrentUserAdmin() && this.isFeatureEnabled('auditLog')();
      case 'users-roles':
        // For Admins and Managers only
        return this.isCurrentUserAdminOrManager();
      default:
        return true;
    }
  }

  login(form: NgForm) {
    this.authError.set(null);

    // Super Admin Login Check
    if (form.value.email === 'superadmin@service.com' && form.value.password === 'superpassword') {
      const superAdminUser: User = {
        id: 'super-admin',
        name: 'Service Provider',
        email: 'superadmin@service.com',
        roleId: 'role-1', // Admin role for simplicity
        companyId: 'none',
        status: 'Active',
        profilePictureUrl: 'https://i.pravatar.cc/150?u=super-admin',
        jobTitle: 'Platform Administrator'
      };
      this.currentUser.set(superAdminUser);
      this.loginAs.set('superadmin');
      this.uiService.view.set('sa_dashboard');
      return;
    }

    // CRM User Login
    const user = this.dataService.users().find(u => u.email === form.value.email);
    if (user && form.value.password === 'password123') {
        this.currentUser.set(user);
        this.loginAs.set('crm');
        this.loggingService.log({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            action: 'login',
            details: `User ${user.name} logged in.`,
            entity: { type: 'user', id: user.id }
        });
        return;
    }
    
    this.authError.set('Invalid email or password.');
  }

  logout() {
    const user = this.currentUser();
    if (user && this.loginAs() === 'crm') {
        this.loggingService.log({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            action: 'logout',
            details: `User ${user.name} logged out.`,
            entity: { type: 'user', id: user.id }
        });
    }
    this.currentUser.set(null);
    this.loginAs.set(null);
    this.uiService.authView.set('login');
  }

  async signup(form: NgForm) {
    this.authError.set(null);

    const defaultPlan = this.dataService.servicePlans().find(p => p.isDefault);
    if (!defaultPlan) {
        this.authError.set('Could not find a default plan. Please contact support.');
        return;
    }
    
    const adminRole = this.dataService.roles().find(r => r.name === 'Admin');
    if (!adminRole) {
        this.authError.set('System configuration error: Admin role not found. Please contact support.');
        return;
    }
    
    // 1. Create a new Company (tenant) with a 30-day trial
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    const newCompany: Company = {
        id: `comp-${Date.now()}`,
        name: form.value.companyName,
        industry: 'Not specified',
        website: '',
        createdAt: new Date().toISOString(),
        planId: defaultPlan.id,
        expiryDate: trialEndDate.toISOString()
    };
    await this.dataService.addCompany(newCompany);
    
    // 2. Create a new user as Admin of the new company
    const newUser: User = {
        id: `user-${Date.now()}`,
        name: form.value.name,
        email: form.value.email,
        companyId: newCompany.id,
        roleId: adminRole.id, // Use the dynamically found Admin role ID
        status: 'Active',
        profilePictureUrl: `https://i.pravatar.cc/150?u=${form.value.email}`
    };
    await this.dataService.addUser(newUser);

    this.currentUser.set(newUser);
    this.loginAs.set('crm');
  }
  
  requestPasswordReset(form: NgForm) {
    alert(`Password reset link sent to ${form.value.email}`);
    this.uiService.authView.set('login');
  }

  resetPassword(form: NgForm) {
    alert(`Password has been reset.`);
    this.uiService.authView.set('login');
  }
  
  updatePasswordStrength(password: string) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    this.passwordStrength.set(strength);
  }
}
