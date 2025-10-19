import { Injectable, signal } from '@angular/core';
import { Company, Contact, Opportunity, Task, Activity, User, Role, EmailTemplate, OpportunityStage, Project, Product, ServicePlan, ServicePlanFeatures, Lead, Quote, Case, LeadStatus, QuoteStatus, CaseStatus, CasePriority } from '../models/crm.models';

const API_DELAY = 300; // ms

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // These signals act as our in-memory "database"
  private db = {
    companies: signal<Company[]>([]),
    contacts: signal<Contact[]>([]),
    opportunities: signal<Opportunity[]>([]),
    tasks: signal<Task[]>([]),
    activities: signal<Activity[]>([]),
    users: signal<User[]>([]),
    roles: signal<Role[]>([]),
    emailTemplates: signal<EmailTemplate[]>([]),
    projects: signal<Project[]>([]),
    products: signal<Product[]>([]),
    servicePlans: signal<ServicePlan[]>([]),
    leads: signal<Lead[]>([]),
    quotes: signal<Quote[]>([]),
    cases: signal<Case[]>([]),
  };

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // ROLES
    const initialRoles: Role[] = [
      { id: 'role-1', name: 'Admin', permissions: ['*'] },
      { id: 'role-2', name: 'Manager', permissions: ['read', 'write'] },
      { id: 'role-3', name: 'Sales Rep', permissions: ['read', 'write_own'] },
    ];
    this.db.roles.set(initialRoles);

    // SERVICE PLANS
    const initialServicePlans: ServicePlan[] = [
        {
            id: 'plan-free',
            name: 'Free',
            monthlyPrice: 0,
            biannualPrice: 0,
            yearlyPrice: 0,
            userLimit: 3,
            contactLimit: 3,
            opportunityLimit: 3,
            companyLimit: 3,
            features: { taskManagement: true, aiAssistant: true, auditLog: true, projects: true, products: true, leads: true, quotes: true, cases: true, reports: true },
            isDefault: true,
        },
        {
            id: 'plan-startup',
            name: 'Startup',
            monthlyPrice: 49,
            biannualPrice: 264,
            yearlyPrice: 499,
            userLimit: 20,
            contactLimit: 1000,
            opportunityLimit: 500,
            companyLimit: 500,
            features: { taskManagement: true, aiAssistant: true, auditLog: false, projects: true, products: true, leads: true, quotes: true, cases: true, reports: true },
            isDefault: false,
        },
        {
            id: 'plan-business',
            name: 'Business',
            monthlyPrice: 99,
            biannualPrice: 534,
            yearlyPrice: 999,
            userLimit: -1, // Unlimited
            contactLimit: -1,
            opportunityLimit: -1,
            companyLimit: -1,
            features: { taskManagement: true, aiAssistant: true, auditLog: true, projects: true, products: true, leads: true, quotes: true, cases: true, reports: true },
            isDefault: false,
        }
    ];
    this.db.servicePlans.set(initialServicePlans);

    // --- CLEAR ALL TENANT DATA ---
    // This leaves the system ready for new signups without any pre-existing tenant data.
    this.db.companies.set([]);
    this.db.users.set([]);
    this.db.contacts.set([]);
    this.db.opportunities.set([]);
    this.db.tasks.set([]);
    this.db.activities.set([]);
    this.db.emailTemplates.set([]);
    this.db.projects.set([]);
    this.db.products.set([]);
    this.db.leads.set([]);
    this.db.quotes.set([]);
    this.db.cases.set([]);
  }

  private request<T>(data: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => resolve(data), API_DELAY);
    });
  }

  // --- GET ---
  getCompanies = () => this.request(this.db.companies());
  getContacts = () => this.request(this.db.contacts());
  getOpportunities = () => this.request(this.db.opportunities());
  getTasks = () => this.request(this.db.tasks());
  getActivities = () => this.request(this.db.activities());
  getUsers = () => this.request(this.db.users());
  getRoles = () => this.request(this.db.roles());
  getEmailTemplates = () => this.request(this.db.emailTemplates());
  getProjects = () => this.request(this.db.projects());
  getProducts = () => this.request(this.db.products());
  getServicePlans = () => this.request(this.db.servicePlans());
  getLeads = () => this.request(this.db.leads());
  getQuotes = () => this.request(this.db.quotes());
  getCases = () => this.request(this.db.cases());

  // --- ADD ---
  addCompany = (company: Company) => { this.db.companies.update(c => [...c, company]); return this.request(company); };
  addContact = (contact: Contact) => { this.db.contacts.update(c => [...c, contact]); return this.request(contact); };
  addOpportunity = (opp: Opportunity) => { this.db.opportunities.update(o => [...o, opp]); return this.request(opp); };
  addTask = (task: Task) => { this.db.tasks.update(t => [...t, task]); return this.request(task); };
  addActivity = (activity: Activity) => { this.db.activities.update(a => [...a, activity]); return this.request(activity); };
  addUser = (user: User) => { this.db.users.update(u => [...u, user]); return this.request(user); };
  addTemplate = (template: EmailTemplate) => { this.db.emailTemplates.update(t => [...t, template]); return this.request(template); };
  addProject = (project: Project) => { this.db.projects.update(p => [...p, project]); return this.request(project); };
  addProduct = (product: Product) => { this.db.products.update(p => [...p, product]); return this.request(product); };
  addServicePlan = (plan: ServicePlan) => { this.db.servicePlans.update(p => [...p, plan]); return this.request(plan); };
  addLead = (lead: Lead) => { this.db.leads.update(l => [...l, lead]); return this.request(lead); };
  addQuote = (quote: Quote) => { this.db.quotes.update(q => [...q, quote]); return this.request(quote); };
  addCase = (kase: Case) => { this.db.cases.update(c => [...c, kase]); return this.request(kase); };

  // --- UPDATE ---
  updateCompany = (updated: Company) => { this.db.companies.update(c => c.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateContact = (updated: Contact) => { this.db.contacts.update(c => c.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateOpportunity = (updated: Opportunity) => { this.db.opportunities.update(o => o.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateTask = (updated: Task) => { this.db.tasks.update(t => t.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateActivity = (updated: Activity) => { this.db.activities.update(a => a.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateUser = (updated: User) => { this.db.users.update(u => u.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateTemplate = (updated: EmailTemplate) => { this.db.emailTemplates.update(t => t.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateProject = (updated: Project) => { this.db.projects.update(p => p.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateProduct = (updated: Product) => { this.db.products.update(p => p.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateServicePlan = (updated: ServicePlan) => { this.db.servicePlans.update(p => p.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateLead = (updated: Lead) => { this.db.leads.update(l => l.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateQuote = (updated: Quote) => { this.db.quotes.update(q => q.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };
  updateCase = (updated: Case) => { this.db.cases.update(c => c.map(x => x.id === updated.id ? updated : x)); return this.request(updated); };

  // --- DELETE ---
  deleteCompany = (id: string) => { this.db.companies.update(c => c.filter(x => x.id !== id)); return this.request({id}); };
  deleteContact = (id: string) => { this.db.contacts.update(c => c.filter(x => x.id !== id)); return this.request({id}); };
  deleteOpportunity = (id: string) => { this.db.opportunities.update(o => o.filter(x => x.id !== id)); return this.request({id}); };
  deleteTask = (id: string) => { this.db.tasks.update(t => t.filter(x => x.id !== id)); return this.request({id}); };
  deleteActivity = (id: string) => { this.db.activities.update(a => a.filter(x => x.id !== id)); return this.request({id}); };
  deleteTemplate = (id: string) => { this.db.emailTemplates.update(t => t.filter(x => x.id !== id)); return this.request({id}); };
  deleteProject = (id: string) => { this.db.projects.update(p => p.filter(x => x.id !== id)); return this.request({id}); };
  deleteProduct = (id: string) => { this.db.products.update(p => p.filter(x => x.id !== id)); return this.request({id}); };
  deleteServicePlan = (id: string) => { this.db.servicePlans.update(p => p.filter(x => x.id !== id)); return this.request({id}); };
  deleteLead = (id: string) => { this.db.leads.update(l => l.filter(x => x.id !== id)); return this.request({id}); };
  deleteQuote = (id: string) => { this.db.quotes.update(q => q.filter(x => x.id !== id)); return this.request({id}); };
  deleteCase = (id: string) => { this.db.cases.update(c => c.filter(x => x.id !== id)); return this.request({id}); };
}