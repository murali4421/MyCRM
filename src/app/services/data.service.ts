
import { Injectable, signal, inject, Injector } from '@angular/core';
import { Company, Contact, Opportunity, Task, Activity, User, Role, EmailTemplate, RelatedEntity, Project, Product, ServicePlan, OpportunityStage, Lead, LeadStatus, Quote, Case } from '../models/crm.models';
import { LoggingService } from './logging.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private loggingService = inject(LoggingService);
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);
  private injector = inject(Injector);
  private _authService: AuthService | undefined;

  private get authService(): AuthService {
    if (!this._authService) {
      this._authService = this.injector.get(AuthService);
    }
    return this._authService;
  }

  isLoading = signal<boolean>(true);

  companies = signal<Company[]>([]);
  contacts = signal<Contact[]>([]);
  opportunities = signal<Opportunity[]>([]);
  tasks = signal<Task[]>([]);
  activities = signal<Activity[]>([]);
  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  emailTemplates = signal<EmailTemplate[]>([]);
  projects = signal<Project[]>([]);
  products = signal<Product[]>([]);
  servicePlans = signal<ServicePlan[]>([]);
  leads = signal<Lead[]>([]);
  quotes = signal<Quote[]>([]);
  cases = signal<Case[]>([]);
  
  constructor() {
    this.loadInitialData();
  }
  
  private async loadInitialData() {
    this.isLoading.set(true);
    try {
        const [
            roles, users, companies, contacts, opportunities, tasks, activities, emailTemplates, projects, products, servicePlans, leads, quotes, cases
        ] = await Promise.all([
            this.apiService.getRoles(),
            this.apiService.getUsers(),
            this.apiService.getCompanies(),
            this.apiService.getContacts(),
            this.apiService.getOpportunities(),
            this.apiService.getTasks(),
            this.apiService.getActivities(),
            this.apiService.getEmailTemplates(),
            this.apiService.getProjects(),
            this.apiService.getProducts(),
            this.apiService.getServicePlans(),
            this.apiService.getLeads(),
            this.apiService.getQuotes(),
            this.apiService.getCases(),
        ]);

        this.roles.set(roles);
        this.users.set(users);
        this.companies.set(companies);
        this.contacts.set(contacts);
        this.opportunities.set(opportunities);
        this.tasks.set(tasks);
        this.activities.set(activities);
        this.emailTemplates.set(emailTemplates);
        this.projects.set(projects);
        this.products.set(products);
        this.servicePlans.set(servicePlans);
        this.leads.set(leads);
        this.quotes.set(quotes);
        this.cases.set(cases);
    } catch (error) {
        console.error("Failed to load initial data", error);
    } finally {
        this.isLoading.set(false);
    }
  }
  
  // --- Getters by ID ---
  getCompanyById = (id: string | undefined) => this.companies().find(c => c.id === id);
  getContactById = (id: string | undefined) => this.contacts().find(c => c.id === id);
  getUserById = (id: string | undefined) => this.users().find(u => u.id === id);
  getRoleById = (id: string | undefined) => this.roles().find(r => r.id === id);
  getPlanById = (id: string | undefined) => this.servicePlans().find(p => p.id === id);
  
  getRelatedEntityName(entity: RelatedEntity): string {
    switch (entity.type) {
      case 'company': return this.getCompanyById(entity.id)?.name || 'N/A';
      case 'contact': return this.getContactById(entity.id)?.name || 'N/A';
      case 'opportunity':
        const opp = this.opportunities().find(o => o.id === entity.id);
        return opp?.name || 'N/A';
      default: return 'N/A';
    }
  }

  private logAction(action: string, details: string, entity: { type: string, id: string }) {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return;
      this.loggingService.log({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          action,
          details,
          entity
      });
  }

  // --- ADD ---
  async addCompany(company: Company) { this.companies.update(c => [...c, company]); await this.apiService.addCompany(company); this.logAction('create', `Created company: ${company.name}`, { type: 'company', id: company.id }); }
  async addContact(contact: Contact) { this.contacts.update(c => [...c, contact]); await this.apiService.addContact(contact); this.logAction('create', `Created contact: ${contact.name}`, { type: 'contact', id: contact.id }); this.handleHotLeadTask(contact); }
  async addOpportunity(opp: Opportunity) { this.opportunities.update(o => [...o, opp]); await this.apiService.addOpportunity(opp); this.logAction('create', `Created opportunity: ${opp.name}`, { type: 'opportunity', id: opp.id }); }
  async addTask(task: Task) { this.tasks.update(t => [...t, task]); await this.apiService.addTask(task); this.logAction('create', `Created task: ${task.title}`, { type: 'task', id: task.id }); }
  async addActivity(activity: Activity) { this.activities.update(a => [...a, activity]); await this.apiService.addActivity(activity); this.logAction('create', `Created activity: ${activity.subject}`, { type: 'activity', id: activity.id }); }
  async addUser(user: User) { this.users.update(u => [...u, user]); await this.apiService.addUser(user); this.logAction('create', `Invited user: ${user.name}`, { type: 'user', id: user.id }); }
  async addTemplate(template: EmailTemplate) { this.emailTemplates.update(t => [...t, template]); await this.apiService.addTemplate(template); }
  async addProject(project: Project) { this.projects.update(p => [...p, project]); await this.apiService.addProject(project); this.logAction('create', `Created project: ${project.name}`, { type: 'project', id: project.id }); }
  async addProduct(product: Product) { this.products.update(p => [...p, product]); await this.apiService.addProduct(product); this.logAction('create', `Created product: ${product.name}`, { type: 'product', id: product.id }); }
  async addServicePlan(plan: ServicePlan) { this.servicePlans.update(p => [...p, plan]); await this.apiService.addServicePlan(plan); }
  async addLead(lead: Lead) { this.leads.update(l => [...l, lead]); await this.apiService.addLead(lead); this.logAction('create', `Created lead: ${lead.name}`, { type: 'lead', id: lead.id }); }
  async addQuote(quote: Quote) { this.quotes.update(q => [...q, quote]); await this.apiService.addQuote(quote); this.logAction('create', `Created quote: ${quote.quoteNumber}`, { type: 'quote', id: quote.id }); }
  async addCase(kase: Case) { this.cases.update(c => [...c, kase]); await this.apiService.addCase(kase); this.logAction('create', `Created case: ${kase.caseNumber}`, { type: 'case', id: kase.id }); }

  // --- UPDATE ---
  async updateCompany(company: Company) { this.companies.update(c => c.map(x => x.id === company.id ? company : x)); await this.apiService.updateCompany(company); this.logAction('update', `Updated company: ${company.name}`, { type: 'company', id: company.id }); }
  async updateContact(contact: Contact) { this.contacts.update(c => c.map(x => x.id === contact.id ? contact : x)); await this.apiService.updateContact(contact); this.logAction('update', `Updated contact: ${contact.name}`, { type: 'contact', id: contact.id }); this.handleHotLeadTask(contact); }
  async updateOpportunity(opp: Opportunity) { const oldOpp = this.opportunities().find(o => o.id === opp.id); this.opportunities.update(o => o.map(x => x.id === opp.id ? opp : x)); await this.apiService.updateOpportunity(opp); this.logAction('update', `Updated opportunity: ${opp.name}`, { type: 'opportunity', id: opp.id }); if (oldOpp?.stage !== OpportunityStage.ClosedWon && opp.stage === OpportunityStage.ClosedWon) { this.handleWonOpportunity(opp); } }
  async updateTask(task: Task) { this.tasks.update(t => t.map(x => x.id === task.id ? task : x)); await this.apiService.updateTask(task); this.logAction('update', `Updated task: ${task.title}`, { type: 'task', id: task.id }); }
  async updateActivity(activity: Activity) { this.activities.update(a => a.map(x => x.id === activity.id ? activity : x)); await this.apiService.updateActivity(activity); this.logAction('update', `Updated activity: ${activity.subject}`, { type: 'activity', id: activity.id }); }
  async updateUser(user: User) { this.users.update(u => u.map(x => x.id === user.id ? user : x)); await this.apiService.updateUser(user); this.logAction('update', `Updated user: ${user.name}`, { type: 'user', id: user.id }); }
  async updateTemplate(template: EmailTemplate) { this.emailTemplates.update(t => t.map(x => x.id === template.id ? template : x)); await this.apiService.updateTemplate(template); }
  async updateProject(project: Project) { this.projects.update(p => p.map(x => x.id === project.id ? project : x)); await this.apiService.updateProject(project); this.logAction('update', `Updated project: ${project.name}`, { type: 'project', id: project.id }); }
  async updateProduct(product: Product) { this.products.update(p => p.map(x => x.id === product.id ? product : x)); await this.apiService.updateProduct(product); this.logAction('update', `Updated product: ${product.name}`, { type: 'product', id: product.id }); }
  async updateServicePlan(plan: ServicePlan) { this.servicePlans.update(p => p.map(x => x.id === plan.id ? plan : x)); await this.apiService.updateServicePlan(plan); }
  async updateLead(lead: Lead) { this.leads.update(l => l.map(x => x.id === lead.id ? lead : x)); await this.apiService.updateLead(lead); this.logAction('update', `Updated lead: ${lead.name}`, { type: 'lead', id: lead.id }); }
  async updateQuote(quote: Quote) { this.quotes.update(q => q.map(x => x.id === quote.id ? quote : x)); await this.apiService.updateQuote(quote); this.logAction('update', `Updated quote: ${quote.quoteNumber}`, { type: 'quote', id: quote.id }); }
  async updateCase(kase: Case) { this.cases.update(c => c.map(x => x.id === kase.id ? kase : x)); await this.apiService.updateCase(kase); this.logAction('update', `Updated case: ${kase.caseNumber}`, { type: 'case', id: kase.id }); }

  // --- DELETE ---
  async deleteCompany(id: string) { this.companies.update(c => c.filter(x => x.id !== id)); await this.apiService.deleteCompany(id); this.logAction('delete', `Deleted company ID: ${id}`, { type: 'company', id }); }
  async deleteContact(id: string) { this.contacts.update(c => c.filter(x => x.id !== id)); await this.apiService.deleteContact(id); this.logAction('delete', `Deleted contact ID: ${id}`, { type: 'contact', id }); }
  async deleteOpportunity(id: string) { this.opportunities.update(o => o.filter(x => x.id !== id)); await this.apiService.deleteOpportunity(id); this.logAction('delete', `Deleted opportunity ID: ${id}`, { type: 'opportunity', id }); }
  async deleteTask(id: string) { this.tasks.update(t => t.filter(x => x.id !== id)); await this.apiService.deleteTask(id); this.logAction('delete', `Deleted task ID: ${id}`, { type: 'task', id }); }
  async deleteActivity(id: string) { this.activities.update(a => a.filter(x => x.id !== id)); await this.apiService.deleteActivity(id); this.logAction('delete', `Deleted activity ID: ${id}`, { type: 'activity', id }); }
  async deleteTemplate(id: string) { this.emailTemplates.update(t => t.filter(x => x.id !== id)); await this.apiService.deleteTemplate(id); }
  async deleteProject(id: string) { this.projects.update(p => p.filter(x => x.id !== id)); await this.apiService.deleteProject(id); this.logAction('delete', `Deleted project ID: ${id}`, { type: 'project', id }); }
  async deleteProduct(id: string) { this.products.update(p => p.filter(x => x.id !== id)); await this.apiService.deleteProduct(id); this.logAction('delete', `Deleted product ID: ${id}`, { type: 'product', id }); }
  async deleteServicePlan(id: string) { this.servicePlans.update(p => p.filter(x => x.id !== id)); await this.apiService.deleteServicePlan(id); }
  async deleteLead(id: string) { this.leads.update(l => l.filter(x => x.id !== id)); await this.apiService.deleteLead(id); this.logAction('delete', `Deleted lead ID: ${id}`, { type: 'lead', id }); }
  async deleteQuote(id: string) { this.quotes.update(q => q.filter(x => x.id !== id)); await this.apiService.deleteQuote(id); this.logAction('delete', `Deleted quote ID: ${id}`, { type: 'quote', id }); }
  async deleteCase(id: string) { this.cases.update(c => c.filter(x => x.id !== id)); await this.apiService.deleteCase(id); this.logAction('delete', `Deleted case ID: ${id}`, { type: 'case', id }); }

  // --- SPECIAL ACTIONS ---
  async toggleTaskCompleted(taskId: string) {
    const task = this.tasks().find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, completed: !task.completed };
      await this.updateTask(updatedTask);
    }
  }

  async reassignContactOwner(contactId: string, newOwnerId: string) {
    const contact = this.contacts().find(c => c.id === contactId);
    if (contact) {
        const updatedContact = { ...contact, ownerId: newOwnerId };
        await this.updateContact(updatedContact);
        const newOwner = this.getUserById(newOwnerId);
        if (newOwner) {
          this.notificationService.addNotification({
              userId: newOwnerId,
              message: `You have been assigned a new contact: ${contact.name}`
          });
        }
    }
  }
  
  async duplicateTemplate(template: EmailTemplate) {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    await this.addTemplate(newTemplate);
  }

  async activatePlanForCompany(companyId: string) {
      const company = this.getCompanyById(companyId);
      if (company) {
          const startupPlan = this.servicePlans().find(p => p.id === 'plan-startup');
          if (startupPlan) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + 30);
              const updatedCompany: Company = {
                  ...company,
                  planId: startupPlan.id,
                  expiryDate: expiryDate.toISOString()
              };
              await this.updateCompany(updatedCompany);
          }
      }
  }
  
  // --- WORKFLOW AUTOMATIONS ---
  private async handleHotLeadTask(contact: Contact) {
      if (contact.leadScore === 'Hot') {
          const existingTask = this.tasks().find(t => t.relatedEntity?.type === 'contact' && t.relatedEntity.id === contact.id && t.title.includes('Follow up with hot lead'));
          if (!existingTask) {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow
              const newTask: Task = {
                  id: `task-hotlead-${Date.now()}`,
                  title: `Follow up with hot lead: ${contact.name}`,
                  dueDate: dueDate.toISOString().split('T')[0],
                  ownerId: contact.ownerId,
                  relatedEntity: { type: 'contact', id: contact.id },
                  completed: false,
                  createdAt: new Date().toISOString()
              };
              await this.addTask(newTask);
              this.notificationService.addNotification({
                  userId: contact.ownerId,
                  message: `New hot lead task created for ${contact.name}.`
              });
          }
      }
  }

  private async handleWonOpportunity(opp: Opportunity) {
    const projectExists = this.projects().some(p => p.name.includes(`Onboarding for ${opp.name}`));
    if (!projectExists) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30-day onboarding project
        const newProject: Project = {
            id: `proj-onboarding-${Date.now()}`,
            name: `Onboarding for ${opp.name}`,
            companyId: opp.companyId,
            status: 'Planning',
            budget: opp.value * 0.1, // 10% of deal value for onboarding
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            ownerId: opp.ownerId,
            description: `Onboarding project for the deal: ${opp.name}`,
            createdAt: new Date().toISOString()
        };
        await this.addProject(newProject);
        this.notificationService.addNotification({
            userId: opp.ownerId,
            message: `New onboarding project created for your won deal: ${opp.name}`
        });
    }
  }

  async convertLead(leadId: string, createOpp: boolean, oppDetails?: { name: string, value: number }) {
    const lead = this.leads().find(l => l.id === leadId);
    if (!lead || lead.status === LeadStatus.Qualified) {
        throw new Error("Lead not found or already converted.");
    }
    
    // 1. Find or create company
    let company = this.companies().find(c => c.name.toLowerCase() === lead.companyName.toLowerCase());
    if (!company) {
        const trialPlan = this.servicePlans().find(p => p.isDefault)!;
        const newCompany: Company = {
            id: `comp-conv-${Date.now()}`,
            name: lead.companyName,
            industry: 'Not specified',
            website: '',
            createdAt: new Date().toISOString(),
            planId: trialPlan.id,
            expiryDate: null,
        };
        await this.addCompany(newCompany);
        company = newCompany;
    }

    // 2. Create contact
    const newContact: Contact = {
        id: `cont-conv-${Date.now()}`,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        companyId: company.id,
        ownerId: lead.ownerId,
        createdAt: new Date().toISOString()
    };
    await this.addContact(newContact);

    // 3. Create opportunity if requested
    if (createOpp && oppDetails) {
        const newOpp: Opportunity = {
            id: `opp-conv-${Date.now()}`,
            name: oppDetails.name,
            companyId: company.id,
            stage: OpportunityStage.Qualification,
            value: oppDetails.value,
            closeDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            ownerId: lead.ownerId,
            createdAt: new Date().toISOString()
        };
        await this.addOpportunity(newOpp);
    }
    
    // 4. Update lead status
    await this.updateLead({ ...lead, status: LeadStatus.Qualified });
  }
}
