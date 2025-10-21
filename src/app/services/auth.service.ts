import { Injectable, signal, computed, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User, Role, Company, AppView, ServicePlanFeatures } from '../models/crm.models';
import { DataService } from './data.service';
import { UiService } from './ui.service';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private dataService = inject(DataService);
  private uiService = inject(UiService);
  private loggingService = inject(LoggingService);

  currentUser = signal<User | null>(null);
  loginAs = signal<'crm' | 'superadmin'>('crm');
  authError = signal<string | null>(null);
  passwordStrength = signal(0);

  // Computed properties for easy access to user and plan info
  currentUserRole = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return this.dataService.getRoleById(user.roleId);
  });

  currentCompany = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return this.dataService.getCompanyById(user.companyId);
  });
  
  currentPlan = computed(() => {
      const company = this.currentCompany();
      if(!company || !company.planId) return null;
      return this.dataService.getPlanById(company.planId);
  });

  isPlanExpired = computed(() => {
    const company = this.currentCompany();
    if (!company) return false;
    return company.expiryDate ? new Date(company.expiryDate) < new Date() : false;
  });

  isCurrentUserAdmin = computed(() => this.currentUserRole()?.name === 'Admin');
  isCurrentUserAdminOrManager = computed(() => ['Admin', 'Manager'].includes(this.currentUserRole()?.name ?? ''));
  
  // Methods
  async login(form: NgForm) {
    this.authError.set(null);
    const { email, password } = form.value;

    if (email === 'superadmin@cortex.app' && password === 'superadmin') {
      this.loginAs.set('superadmin');
      // Create a dummy user for the superadmin session
      this.currentUser.set({ id: 'superadmin', name: 'Super Admin', email: 'superadmin@cortex.app', roleId: 'role-1', companyId: 'none', status: 'Active', profilePictureUrl: ''});
      return;
    }
    
    // Simulate API call
    await new Promise(res => setTimeout(res, 500));
    
    const user = this.dataService.users().find(u => u.email === email);

    if (user) {
      this.currentUser.set(user);
      this.loginAs.set('crm');
      this.loggingService.log({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        action: 'login',
        details: 'User logged in.',
        entity: { type: 'user', id: user.id }
      });
    } else {
      this.authError.set('Invalid credentials. Please try again.');
    }
  }

  async signup(form: NgForm) {
    this.authError.set(null);
    const { companyName, name, email, password } = form.value;
    
    // Simulate API call
    await new Promise(res => setTimeout(res, 500));

    if (this.dataService.users().some(u => u.email === email)) {
      this.authError.set('An account with this email already exists.');
      return;
    }

    const trialPlan = this.dataService.servicePlans().find(p => p.isDefault)!;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14); // 14-day trial
    
    const newCompanyId = `comp-signup-${Date.now()}`;
    const newUserId = `user-signup-${Date.now()}`;

    // 1. Create Company (which is the tenant)
    const newCompany: Company = {
      id: newCompanyId,
      name: companyName,
      industry: 'Not specified',
      website: '',
      createdAt: new Date().toISOString(),
      planId: trialPlan.id,
      expiryDate: expiryDate.toISOString(),
      ownerId: newUserId, // The tenant company is "owned" by its admin
    };

    // 2. Create Admin User for the company
    const adminRole = this.dataService.roles().find(r => r.name === 'Admin')!;
    const newUser: User = {
      id: newUserId,
      name: name,
      email: email,
      companyId: newCompany.id,
      roleId: adminRole.id,
      status: 'Active',
      profilePictureUrl: `https://i.pravatar.cc/150?u=${email}`
    };

    await this.dataService.addCompany(newCompany);
    await this.dataService.addUser(newUser);

    // 3. Log in the new user
    this.currentUser.set(newUser);
    this.loginAs.set('crm');
  }

  logout() {
    this.currentUser.set(null);
    this.authError.set(null);
    this.uiService.authView.set('login');
  }
  
  async changePassword(current: string, newPass: string): Promise<{ success: boolean, message: string }> {
      // Mock implementation
      await new Promise(res => setTimeout(res, 500));
      if (current === 'password123') { // Mock incorrect password
          return { success: false, message: 'Current password does not match.' };
      }
      return { success: true, message: 'Password updated successfully.' };
  }
  
  updatePasswordStrength(password: string) {
    let score = 0;
    if (!password) {
      this.passwordStrength.set(0);
      return;
    }
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    this.passwordStrength.set(score);
  }

  isViewAllowed = (view: AppView): boolean => {
    if (this.isPlanExpired()) return view === 'dashboard';

    const planFeatures = this.currentPlan()?.features;
    if (!planFeatures) return false;

    switch(view) {
        case 'audit-log': return planFeatures.auditLog;
        case 'projects': return planFeatures.projects;
        case 'products': return planFeatures.products;
        case 'leads': return planFeatures.leads;
        case 'quotes': return planFeatures.quotes;
        case 'cases': return planFeatures.cases;
        case 'reports': return planFeatures.reports;
        case 'tasks': return planFeatures.taskManagement;
        default: return true; // dashboard, contacts, companies, etc. are always allowed
    }
  }
  
  isFeatureEnabled = (feature: keyof ServicePlanFeatures) => computed(() => {
      if (this.isPlanExpired()) return false;
      return this.currentPlan()?.features[feature] ?? false;
  });

  limitFor = (entity: 'user' | 'company' | 'contact' | 'opportunity') => computed(() => {
    const plan = this.currentPlan();
    if (!plan) return 0;
    switch(entity) {
        case 'user': return plan.userLimit;
        case 'company': return plan.companyLimit;
        case 'contact': return plan.contactLimit;
        case 'opportunity': return plan.opportunityLimit;
    }
  });

  private tenantUserIds = computed(() => {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return new Set<string>();
    }
    const currentTenantId = currentUser.companyId;
    return new Set(this.dataService.users().filter(u => u.companyId === currentTenantId).map(u => u.id));
  });

  canAddUser = computed(() => {
    const limit = this.limitFor('user')();
    if (limit === -1) return true; // Unlimited
    return this.tenantUserIds().size < limit;
  });

  canAddCompany = computed(() => {
    const limit = this.limitFor('company')();
    if (limit === -1) return true; // Unlimited
    const tenantUserIds = this.tenantUserIds();
    // Count companies owned by any user in the tenant.
    const tenantCompaniesCount = this.dataService.companies().filter(c => c.ownerId && tenantUserIds.has(c.ownerId)).length;
    return tenantCompaniesCount < limit;
  });
  
  canAddContact = computed(() => {
    const limit = this.limitFor('contact')();
    if (limit === -1) return true;
    const tenantUserIds = this.tenantUserIds();
    const tenantContactsCount = this.dataService.contacts().filter(c => tenantUserIds.has(c.ownerId)).length;
    return tenantContactsCount < limit;
  });
  
  canAddOpportunity = computed(() => {
    const limit = this.limitFor('opportunity')();
    if (limit === -1) return true;
    const tenantUserIds = this.tenantUserIds();
    const tenantOppsCount = this.dataService.opportunities().filter(o => tenantUserIds.has(o.ownerId)).length;
    return tenantOppsCount < limit;
  });
}