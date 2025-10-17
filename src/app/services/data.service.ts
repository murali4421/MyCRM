import { Injectable, signal, inject } from '@angular/core';
import { Company, Contact, Opportunity, Task, Activity, User, Role, EmailTemplate, OpportunityStage, RelatedEntity } from '../models/crm.models';
import { LoggingService } from './logging.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private loggingService = inject(LoggingService);
  private authService = inject(AuthService);

  companies = signal<Company[]>([]);
  contacts = signal<Contact[]>([]);
  opportunities = signal<Opportunity[]>([]);
  tasks = signal<Task[]>([]);
  activities = signal<Activity[]>([]);
  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  emailTemplates = signal<EmailTemplate[]>([]);
  
  constructor() {
    this.loadInitialData();
  }
  
  private loadInitialData() {
    // ROLES
    const initialRoles: Role[] = [
      { id: 'role-1', name: 'Admin', permissions: ['*'] },
      { id: 'role-2', name: 'Manager', permissions: ['read', 'write'] },
      { id: 'role-3', name: 'Sales Rep', permissions: ['read', 'write_own'] },
    ];
    this.roles.set(initialRoles);

    // USERS
    const initialUsers: User[] = [
      { id: 'user-1', name: 'Alex Johnson', email: 'alex.j@example.com', roleId: 'role-1', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-1' },
      { id: 'user-2', name: 'Maria Garcia', email: 'maria.g@example.com', roleId: 'role-2', managerId: 'user-1', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-2' },
      { id: 'user-3', name: 'David Smith', email: 'david.s@example.com', roleId: 'role-3', managerId: 'user-2', status: 'Active', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-3' },
      { id: 'user-4', name: 'Jennifer Lee', email: 'jen.lee@example.com', roleId: 'role-3', managerId: 'user-2', status: 'Invited', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-4' },
    ];
    this.users.set(initialUsers);

    // COMPANIES
    const initialCompanies: Company[] = [
      { id: 'comp-1', name: 'Innovate Inc.', industry: 'Technology', website: 'https://innovate.com', createdAt: new Date('2023-01-15').toISOString(), logoUrl: 'https://logo.clearbit.com/innovate.com' },
      { id: 'comp-2', name: 'Apex Solutions', industry: 'Consulting', website: 'https://apex.com', createdAt: new Date('2023-02-20').toISOString(), logoUrl: 'https://logo.clearbit.com/apex.com' },
      { id: 'comp-3', name: 'Quantum Logistics', industry: 'Shipping', website: 'https://quantumlog.com', createdAt: new Date('2023-03-10').toISOString(), logoUrl: 'https://logo.clearbit.com/quantum.com' },
    ];
    this.companies.set(initialCompanies);

    // CONTACTS
    const initialContacts: Contact[] = [
      { id: 'cont-1', name: 'Sarah Chen', email: 'sarah.chen@innovate.com', phone: '555-0101', companyId: 'comp-1', ownerId: 'user-3', createdAt: new Date('2023-01-16').toISOString() },
      { id: 'cont-2', name: 'Tom Riley', email: 'tom.riley@apex.com', phone: '555-0102', companyId: 'comp-2', ownerId: 'user-3', createdAt: new Date('2023-02-21').toISOString() },
      { id: 'cont-3', name: 'Linda Kim', email: 'linda.kim@quantumlog.com', phone: '555-0103', companyId: 'comp-3', ownerId: 'user-4', createdAt: new Date('2023-03-11').toISOString() },
      { id: 'cont-4', name: 'Mike Brown', email: 'mike.brown@innovate.com', phone: '555-0104', companyId: 'comp-1', ownerId: 'user-2', createdAt: new Date('2023-04-01').toISOString() },
    ];
    this.contacts.set(initialContacts);

    // OPPORTUNITIES
    const initialOpps: Opportunity[] = [
        { id: 'opp-1', name: 'Innovate Software Upgrade', companyId: 'comp-1', stage: OpportunityStage.Proposal, value: 50000, closeDate: '2024-08-30', ownerId: 'user-3', createdAt: new Date().toISOString() },
        { id: 'opp-2', name: 'Apex Consulting Retainer', companyId: 'comp-2', stage: OpportunityStage.Qualification, value: 75000, closeDate: '2024-09-15', ownerId: 'user-3', createdAt: new Date().toISOString() },
        { id: 'opp-3', name: 'Quantum Shipping Contract', companyId: 'comp-3', stage: OpportunityStage.Negotiation, value: 120000, closeDate: '2024-07-25', ownerId: 'user-4', createdAt: new Date().toISOString() },
        { id: 'opp-4', name: 'Innovate Cloud Migration', companyId: 'comp-1', stage: OpportunityStage.ClosedWon, value: 80000, closeDate: '2024-05-20', ownerId: 'user-2', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'opp-5', name: 'Apex Security Audit', companyId: 'comp-2', stage: OpportunityStage.ClosedLost, value: 30000, closeDate: '2024-06-01', ownerId: 'user-3', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    this.opportunities.set(initialOpps);
    
    // TASKS
    const today = new Date().toISOString().split('T')[0];
    const initialTasks: Task[] = [
        { id: 'task-1', title: 'Follow up with Sarah Chen', dueDate: today, ownerId: 'user-3', completed: false, createdAt: new Date().toISOString(), relatedEntity: { type: 'contact', id: 'cont-1'} },
        { id: 'task-2', title: 'Prepare proposal for Apex', dueDate: today, ownerId: 'user-3', completed: false, createdAt: new Date().toISOString(), relatedEntity: { type: 'opportunity', id: 'opp-2'} },
        { id: 'task-3', title: 'Schedule demo with Mike Brown', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], ownerId: 'user-2', completed: false, createdAt: new Date().toISOString() },
    ];
    this.tasks.set(initialTasks);
    
    // ACTIVITIES
    const initialActivities: Activity[] = [
        { id: 'act-1', type: 'Call summary', subject: 'Initial call with Tom', description: 'Discussed Apex needs, seems positive.', startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Done', ownerId: 'user-3', relatedEntity: { type: 'contact', id: 'cont-2' } },
        { id: 'act-2', type: 'Email', subject: 'Re: Innovate Upgrade', description: 'Sent over the pricing details.', startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Done', ownerId: 'user-3', relatedEntity: { type: 'opportunity', id: 'opp-1' } },
        { id: 'act-3', type: 'Meeting', subject: 'Project Kickoff', description: 'Met with the Innovate team.', startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Done', ownerId: 'user-2', relatedEntity: { type: 'company', id: 'comp-1' } },
    ];
    this.activities.set(initialActivities);

    // EMAIL TEMPLATES
    const initialTemplates: EmailTemplate[] = [
        { id: 'tpl-1', name: 'Initial Outreach', subject: 'Intro from {{owner.name}}', body: 'Hi {{contact.name}},\n\nMy name is {{owner.name}} and I work at CRM Pro.\n\nBest,\n{{owner.name}}', createdAt: new Date('2023-05-01').toISOString() },
        { id: 'tpl-2', name: 'Follow-up', subject: 'Following up', body: 'Hi {{contact.name}},\n\nJust wanted to follow up on our last conversation.\n\nThanks,\n{{owner.name}}', createdAt: new Date('2023-05-15').toISOString() },
    ];
    this.emailTemplates.set(initialTemplates);
  }

  // --- Getters ---
  getCompanyById = (id: string | undefined) => this.companies().find(c => c.id === id);
  getUserById = (id: string | undefined) => this.users().find(u => u.id === id);
  getRoleById = (id: string | undefined) => this.roles().find(r => r.id === id);
  getRelatedEntityName(entity: RelatedEntity) {
    switch(entity.type) {
      case 'company': return this.companies().find(c => c.id === entity.id)?.name;
      case 'contact': return this.contacts().find(c => c.id === entity.id)?.name;
      case 'opportunity': return this.opportunities().find(o => o.id === entity.id)?.name;
      default: return 'N/A';
    }
  }

  // --- Mutators ---
  private log(action: string, details: string, entity: { type: string, id: string }) {
    this.loggingService.log({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: this.authService.currentUser()!.id,
      action,
      details,
      entity,
    });
  }

  addCompany(company: Company) { this.companies.update(c => [...c, company]); this.log('add_company', `Added company: ${company.name}`, {type: 'company', id: company.id}); }
  updateCompany(updated: Company) { this.companies.update(c => c.map(x => x.id === updated.id ? updated : x)); this.log('update_company', `Updated company: ${updated.name}`, {type: 'company', id: updated.id}); }
  deleteCompany(id: string) { const name = this.getCompanyById(id)?.name; this.companies.update(c => c.filter(x => x.id !== id)); if(name) this.log('delete_company', `Deleted company: ${name}`, {type: 'company', id}); }

  addContact(contact: Contact) { this.contacts.update(c => [...c, contact]); this.log('add_contact', `Added contact: ${contact.name}`, {type: 'contact', id: contact.id}); }
  updateContact(updated: Contact) { this.contacts.update(c => c.map(x => x.id === updated.id ? updated : x)); this.log('update_contact', `Updated contact: ${updated.name}`, {type: 'contact', id: updated.id}); }
  deleteContact(id: string) { const name = this.contacts().find(c=>c.id===id)?.name; this.contacts.update(c => c.filter(x => x.id !== id)); if(name) this.log('delete_contact', `Deleted contact: ${name}`, {type: 'contact', id}); }

  addOpportunity(opp: Opportunity) { this.opportunities.update(o => [...o, opp]); this.log('add_opportunity', `Added opportunity: ${opp.name}`, {type: 'opportunity', id: opp.id}); }
  updateOpportunity(updated: Opportunity) { this.opportunities.update(o => o.map(x => x.id === updated.id ? updated : x)); this.log('update_opportunity', `Updated opportunity: ${updated.name}`, {type: 'opportunity', id: updated.id}); }
  deleteOpportunity(id: string) { const name = this.opportunities().find(o=>o.id===id)?.name; this.opportunities.update(o => o.filter(x => x.id !== id)); if(name) this.log('delete_opportunity', `Deleted opportunity: ${name}`, {type: 'opportunity', id}); }

  addTask(task: Task) { this.tasks.update(t => [...t, task]); this.log('add_task', `Added task: ${task.title}`, {type: 'task', id: task.id}); }
  updateTask(updated: Task) { this.tasks.update(t => t.map(x => x.id === updated.id ? updated : x)); this.log('update_task', `Updated task: ${updated.title}`, {type: 'task', id: updated.id}); }
  deleteTask(id: string) { const title = this.tasks().find(t=>t.id===id)?.title; this.tasks.update(t => t.filter(x => x.id !== id)); if(title) this.log('delete_task', `Deleted task: ${title}`, {type: 'task', id}); }
  toggleTaskCompleted(id: string) {
    this.tasks.update(tasks => tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t));
    const task = this.tasks().find(t => t.id === id);
    if(task) this.log('update_task', `Task '${task.title}' marked as ${task.completed ? 'complete' : 'incomplete'}`, {type: 'task', id: task.id});
  }

  addActivity(activity: Activity) { this.activities.update(a => [...a, activity]); this.log('add_activity', `Logged activity: ${activity.subject}`, {type: 'activity', id: activity.id}); }
  updateActivity(updated: Activity) { this.activities.update(a => a.map(x => x.id === updated.id ? updated : x)); this.log('update_activity', `Updated activity: ${updated.subject}`, {type: 'activity', id: updated.id}); }
  deleteActivity(id: string) {
    const activity = this.activities().find(a => a.id === id);
    if (activity) {
      this.activities.update(a => a.filter(x => x.id !== id));
      this.log('delete_activity', `Deleted activity: ${activity.subject}`, { type: 'activity', id });
    }
  }

  addUser(user: User) { this.users.update(u => [...u, user]); this.log('add_user', `Invited user: ${user.name}`, {type: 'user', id: user.id}); }
  updateUser(updated: User) { this.users.update(u => u.map(x => x.id === updated.id ? updated : x)); this.log('update_user', `Updated user: ${updated.name}`, {type: 'user', id: updated.id}); }

  addTemplate(template: EmailTemplate) { this.emailTemplates.update(t => [...t, template]); }
  updateTemplate(updated: EmailTemplate) { this.emailTemplates.update(t => t.map(x => x.id === updated.id ? updated : x)); }
  deleteTemplate(id: string) {
    const template = this.emailTemplates().find(t => t.id === id);
    if (template) {
      this.emailTemplates.update(t => t.filter(x => x.id !== id));
      this.log('delete_template', `Deleted template: ${template.name}`, { type: 'template', id });
    }
  }
  duplicateTemplate(template: EmailTemplate) {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    this.addTemplate(newTemplate);
    this.log('duplicate_template', `Duplicated template: ${template.name}`, { type: 'template', id: newTemplate.id });
  }


  reassignContactOwner(contactId: string, newOwnerId: string) {
    this.contacts.update(contacts => contacts.map(c => c.id === contactId ? { ...c, ownerId: newOwnerId } : c));
    const contact = this.contacts().find(c=>c.id===contactId);
    const newOwner = this.getUserById(newOwnerId);
    if(contact && newOwner) this.log('reassign_contact', `Reassigned contact '${contact.name}' to ${newOwner.name}`, {type: 'contact', id: contact.id});
  }
}