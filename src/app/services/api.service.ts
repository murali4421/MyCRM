import { Injectable, signal } from '@angular/core';
import { Company, Contact, Opportunity, Task, Activity, User, Role, EmailTemplate, OpportunityStage, Project, Product, ServicePlan, ServicePlanFeatures } from '../models/crm.models';

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
            userLimit: 5,
            contactLimit: 100,
            opportunityLimit: 20,
            companyLimit: 20,
            features: { taskManagement: true, aiAssistant: false, auditLog: false, projects: false, products: false },
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
            features: { taskManagement: true, aiAssistant: true, auditLog: false, projects: true, products: true },
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
            features: { taskManagement: true, aiAssistant: true, auditLog: true, projects: true, products: true },
            isDefault: false,
        }
    ];
    this.db.servicePlans.set(initialServicePlans);

    // COMPANIES
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    const initialCompanies: Company[] = [
      { id: 'comp-1', name: 'Innovate Inc.', industry: 'Technology', website: 'https://innovate.com', createdAt: new Date('2023-01-15').toISOString(), logoUrl: 'https://logo.clearbit.com/innovate.com', planId: 'plan-business', expiryDate: null },
      { id: 'comp-2', name: 'Apex Solutions', industry: 'Consulting', website: 'https://apex.com', createdAt: new Date('2023-02-20').toISOString(), logoUrl: 'https://logo.clearbit.com/apex.com', planId: 'plan-startup', expiryDate: null },
      { id: 'comp-3', name: 'Quantum Logistics', industry: 'Shipping', website: 'https://quantumlog.com', createdAt: new Date('2023-03-10').toISOString(), logoUrl: 'https://logo.clearbit.com/quantum.com', planId: 'plan-startup', expiryDate: null },
      { id: 'comp-4', name: 'Healthful Goods', industry: 'Retail', website: 'https://healthfulgoods.com', createdAt: new Date('2023-04-05').toISOString(), logoUrl: 'https://logo.clearbit.com/healthfulgoods.com', planId: 'plan-free', expiryDate: null },
      { id: 'comp-5', name: 'Expired Ventures', industry: 'Defunct', website: 'https://expired.com', createdAt: new Date('2024-01-01').toISOString(), logoUrl: 'https://logo.clearbit.com/expired.com', planId: 'plan-free', expiryDate: expiredDate.toISOString() }
    ];
    this.db.companies.set(initialCompanies);

    // USERS
    const initialUsers: User[] = [
      { id: 'user-1', name: 'Admin User', email: 'admin@crm.com', roleId: 'role-1', companyId: 'comp-1', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=admin@crm.com', jobTitle: 'System Admin' },
      { id: 'user-2', name: 'Maria Garcia', email: 'maria.g@example.com', roleId: 'role-2', companyId: 'comp-1', managerId: 'user-1', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-2', jobTitle: 'Sales Manager' },
      { id: 'user-3', name: 'David Smith', email: 'david.s@example.com', roleId: 'role-3', companyId: 'comp-1', managerId: 'user-2', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-3', jobTitle: 'Sales Representative' },
      { id: 'user-4', name: 'Jennifer Lee', email: 'jen.lee@example.com', roleId: 'role-3', companyId: 'comp-2', managerId: 'user-2', status: 'Invited', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-4', jobTitle: 'Sales Representative' },
      { id: 'user-5', name: 'Expired User', email: 'expired@crm.com', roleId: 'role-3', companyId: 'comp-5', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=expired@crm.com', jobTitle: 'Former Employee' },
    ];
    this.db.users.set(initialUsers);

    // CONTACTS
    const initialContacts: Contact[] = [
      { id: 'cont-1', name: 'Sarah Chen', email: 'sarah.chen@innovate.com', phone: '555-0101', companyId: 'comp-1', ownerId: 'user-3', createdAt: new Date('2023-01-16').toISOString(), leadScore: 'Warm' },
      { id: 'cont-2', name: 'Tom Riley', email: 'tom.riley@apex.com', phone: '555-0102', companyId: 'comp-2', ownerId: 'user-3', createdAt: new Date('2023-02-21').toISOString(), leadScore: 'Hot' },
      { id: 'cont-3', name: 'Linda Kim', email: 'linda.kim@quantumlog.com', phone: '555-0103', companyId: 'comp-3', ownerId: 'user-4', createdAt: new Date('2023-03-11').toISOString(), leadScore: 'Cold' },
      { id: 'cont-4', name: 'Mike Brown', email: 'mike.brown@innovate.com', phone: '555-0104', companyId: 'comp-1', ownerId: 'user-2', createdAt: new Date('2023-04-01').toISOString(), leadScore: 'Warm' },
    ];
    this.db.contacts.set(initialContacts);

    // OPPORTUNITIES
    const initialOpps: Opportunity[] = [
        { id: 'opp-1', name: 'Innovate Software Upgrade', companyId: 'comp-1', stage: OpportunityStage.Proposal, value: 50000, closeDate: '2024-08-30', ownerId: 'user-3', createdAt: new Date().toISOString() },
        { id: 'opp-2', name: 'Apex Consulting Retainer', companyId: 'comp-2', stage: OpportunityStage.Qualification, value: 75000, closeDate: '2024-09-15', ownerId: 'user-3', createdAt: new Date().toISOString() },
        { id: 'opp-3', name: 'Quantum Shipping Contract', companyId: 'comp-3', stage: OpportunityStage.Negotiation, value: 120000, closeDate: '2024-07-25', ownerId: 'user-4', createdAt: new Date().toISOString() },
        { id: 'opp-4', name: 'Innovate Cloud Migration', companyId: 'comp-1', stage: OpportunityStage.ClosedWon, value: 80000, closeDate: '2024-05-20', ownerId: 'user-2', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'opp-5', name: 'Apex Security Audit', companyId: 'comp-2', stage: OpportunityStage.ClosedLost, value: 30000, closeDate: '2024-06-01', ownerId: 'user-3', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    this.db.opportunities.set(initialOpps);
    
    // TASKS
    const today = new Date().toISOString().split('T')[0];
    const initialTasks: Task[] = [
        { id: 'task-1', title: 'Follow up with Sarah Chen', dueDate: today, ownerId: 'user-3', completed: false, createdAt: new Date().toISOString(), relatedEntity: { type: 'contact', id: 'cont-1'} },
        { id: 'task-2', title: 'Prepare proposal for Apex', dueDate: today, ownerId: 'user-3', completed: false, createdAt: new Date().toISOString(), relatedEntity: { type: 'opportunity', id: 'opp-2'} },
        { id: 'task-3', title: 'Schedule demo with Mike Brown', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], ownerId: 'user-2', completed: false, createdAt: new Date().toISOString() },
    ];
    this.db.tasks.set(initialTasks);
    
    // ACTIVITIES
    const initialActivities: Activity[] = [
        { id: 'act-1', type: 'Call summary', subject: 'Initial call with Tom', description: 'Discussed Apex needs, seems positive.', startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Done', ownerId: 'user-3', relatedEntity: { type: 'contact', id: 'cont-2' } },
        { id: 'act-2', type: 'Email', subject: 'Re: Innovate Upgrade', description: 'Sent over the pricing details.', startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Done', ownerId: 'user-3', relatedEntity: { type: 'opportunity', id: 'opp-1' } },
        { id: 'act-3', type: 'Meeting', subject: 'Project Kickoff', description: 'Met with the Innovate team.', startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Done', ownerId: 'user-2', relatedEntity: { type: 'company', id: 'comp-1' } },
    ];
    this.db.activities.set(initialActivities);

    // EMAIL TEMPLATES
    const initialTemplates: EmailTemplate[] = [
        { id: 'tpl-1', name: 'Initial Outreach', subject: 'Intro from {{owner.name}}', body: 'Hi {{contact.name}},\n\nMy name is {{owner.name}} and I work at CRM Pro.\n\nBest,\n{{owner.name}}', createdAt: new Date('2023-05-01').toISOString() },
        { id: 'tpl-2', name: 'Follow-up', subject: 'Following up', body: 'Hi {{contact.name}},\n\nJust wanted to follow up on our last conversation.\n\nThanks,\n{{owner.name}}', createdAt: new Date('2023-05-15').toISOString() },
    ];
    this.db.emailTemplates.set(initialTemplates);

    // PROJECTS
    const initialProjects: Project[] = [
      { id: 'proj-1', name: 'Website Redesign', companyId: 'comp-1', status: 'In Progress', budget: 25000, startDate: '2024-07-01', endDate: '2024-10-31', ownerId: 'user-2', description: 'Complete overhaul of the innovate.com website.', createdAt: new Date('2024-06-15').toISOString() },
      { id: 'proj-2', name: 'Q3 Marketing Campaign', companyId: 'comp-2', status: 'Planning', budget: 40000, startDate: '2024-08-01', endDate: '2024-09-30', ownerId: 'user-2', description: 'Digital marketing campaign for new service launch.', createdAt: new Date('2024-06-20').toISOString() },
      { id: 'proj-3', name: 'Logistics System Upgrade', companyId: 'comp-3', status: 'Completed', budget: 150000, startDate: '2024-01-10', endDate: '2024-06-10', ownerId: 'user-1', description: 'Upgrade of the core logistics and tracking system.', createdAt: new Date('2024-01-05').toISOString() },
    ];
    this.db.projects.set(initialProjects);

    // PRODUCTS & SERVICES
    const initialProducts: Product[] = [
      { id: 'prod-1', name: 'CRM Pro License', description: 'Per-seat annual license for our flagship CRM software.', category: 'Software', price: 600, createdAt: new Date('2023-01-01').toISOString(), ownerId: 'user-1' },
      { id: 'prod-2', name: 'Implementation Package', description: 'Onboarding and implementation service for new clients.', category: 'Service', price: 2500, createdAt: new Date('2023-01-01').toISOString(), ownerId: 'user-2' },
      { id: 'prod-3', name: 'Advanced Analytics Module', description: 'Add-on module for advanced reporting and business intelligence.', category: 'Software', price: 450, createdAt: new Date('2023-03-01').toISOString(), ownerId: 'user-3' },
      { id: 'prod-4', name: 'Strategic Consulting', description: 'Hourly consulting with a senior strategist.', category: 'Consulting', price: 300, createdAt: new Date('2023-02-01').toISOString(), ownerId: 'user-2' },
    ];
    this.db.products.set(initialProducts);
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
}