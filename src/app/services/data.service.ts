import { Injectable, signal, inject } from '@angular/core';
import { Company, Contact, Opportunity, Task, Activity, User, Role, EmailTemplate, RelatedEntity } from '../models/crm.models';
import { LoggingService } from './logging.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private loggingService = inject(LoggingService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  isLoading = signal<boolean>(true);

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
  
  private async loadInitialData() {
    this.isLoading.set(true);
    try {
        const [
            roles, users, companies, contacts, opportunities, tasks, activities, emailTemplates
        ] = await Promise.all([
            this.apiService.getRoles(),
            this.apiService.getUsers(),
            this.apiService.getCompanies(),
            this.apiService.getContacts(),
            this.apiService.getOpportunities(),
            this.apiService.getTasks(),
            this.apiService.getActivities(),
            this.apiService.getEmailTemplates(),
        ]);

        this.roles.set(roles);
        this.users.set(users);
        this.companies.set(companies);
        this.contacts.set(contacts);
        this.opportunities.set(opportunities);
        this.tasks.set(tasks);
        this.activities.set(activities);
        this.emailTemplates.set(emailTemplates);
    } catch (error) {
        console.error("Failed to load initial data", error);
        // Handle error state in UI if necessary
    } finally {
        this.isLoading.set(false);
    }
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
    const user = this.authService.currentUser();
    if (!user) {
      console.error('Cannot log action, no current user found.');
      return;
    }
    this.loggingService.log({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      action,
      details,
      entity,
    });
  }

  async addCompany(company: Company) { 
    const newCompany = await this.apiService.addCompany(company);
    this.companies.update(c => [...c, newCompany]); 
    this.log('add_company', `Added company: ${newCompany.name}`, {type: 'company', id: newCompany.id}); 
  }
  async updateCompany(updated: Company) { 
    const updatedCompany = await this.apiService.updateCompany(updated);
    this.companies.update(c => c.map(x => x.id === updatedCompany.id ? updatedCompany : x)); 
    this.log('update_company', `Updated company: ${updatedCompany.name}`, {type: 'company', id: updatedCompany.id}); 
  }
  async deleteCompany(id: string) { 
    const name = this.getCompanyById(id)?.name; 
    await this.apiService.deleteCompany(id);
    this.companies.update(c => c.filter(x => x.id !== id)); 
    if(name) this.log('delete_company', `Deleted company: ${name}`, {type: 'company', id}); 
  }

  async addContact(contact: Contact) { 
    const newContact = await this.apiService.addContact(contact);
    this.contacts.update(c => [...c, newContact]); 
    this.log('add_contact', `Added contact: ${newContact.name}`, {type: 'contact', id: newContact.id}); 
  }
  async updateContact(updated: Contact) { 
    const updatedContact = await this.apiService.updateContact(updated);
    this.contacts.update(c => c.map(x => x.id === updatedContact.id ? updatedContact : x)); 
    this.log('update_contact', `Updated contact: ${updatedContact.name}`, {type: 'contact', id: updatedContact.id}); 
  }
  async deleteContact(id: string) { 
    const name = this.contacts().find(c=>c.id===id)?.name; 
    await this.apiService.deleteContact(id);
    this.contacts.update(c => c.filter(x => x.id !== id)); 
    if(name) this.log('delete_contact', `Deleted contact: ${name}`, {type: 'contact', id}); 
  }

  async addOpportunity(opp: Opportunity) { 
    const newOpp = await this.apiService.addOpportunity(opp);
    this.opportunities.update(o => [...o, newOpp]); 
    this.log('add_opportunity', `Added opportunity: ${newOpp.name}`, {type: 'opportunity', id: newOpp.id}); 
  }
  async updateOpportunity(updated: Opportunity) { 
    const updatedOpp = await this.apiService.updateOpportunity(updated);
    this.opportunities.update(o => o.map(x => x.id === updatedOpp.id ? updatedOpp : x)); 
    this.log('update_opportunity', `Updated opportunity: ${updatedOpp.name}`, {type: 'opportunity', id: updatedOpp.id}); 
  }
  async deleteOpportunity(id: string) { 
    const name = this.opportunities().find(o=>o.id===id)?.name; 
    await this.apiService.deleteOpportunity(id);
    this.opportunities.update(o => o.filter(x => x.id !== id)); 
    if(name) this.log('delete_opportunity', `Deleted opportunity: ${name}`, {type: 'opportunity', id}); 
  }

  async addTask(task: Task) { 
    const newTask = await this.apiService.addTask(task);
    this.tasks.update(t => [...t, newTask]); 
    this.log('add_task', `Added task: ${newTask.title}`, {type: 'task', id: newTask.id}); 
  }
  async updateTask(updated: Task) { 
    const updatedTask = await this.apiService.updateTask(updated);
    this.tasks.update(t => t.map(x => x.id === updatedTask.id ? updatedTask : x)); 
    this.log('update_task', `Updated task: ${updatedTask.title}`, {type: 'task', id: updatedTask.id}); 
  }
  async deleteTask(id: string) { 
    const title = this.tasks().find(t=>t.id===id)?.title; 
    await this.apiService.deleteTask(id);
    this.tasks.update(t => t.filter(x => x.id !== id)); 
    if(title) this.log('delete_task', `Deleted task: ${title}`, {type: 'task', id}); 
  }
  async toggleTaskCompleted(id: string) {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    await this.apiService.updateTask(updatedTask);
    this.tasks.update(tasks => tasks.map(t => t.id === id ? updatedTask : t));
    this.log('update_task', `Task '${updatedTask.title}' marked as ${updatedTask.completed ? 'complete' : 'incomplete'}`, {type: 'task', id: updatedTask.id});
  }

  async addActivity(activity: Activity) { 
    const newActivity = await this.apiService.addActivity(activity);
    this.activities.update(a => [...a, newActivity]); 
    this.log('add_activity', `Logged activity: ${newActivity.subject}`, {type: 'activity', id: newActivity.id}); 
  }
  async updateActivity(updated: Activity) { 
    const updatedActivity = await this.apiService.updateActivity(updated);
    this.activities.update(a => a.map(x => x.id === updatedActivity.id ? updatedActivity : x)); 
    this.log('update_activity', `Updated activity: ${updatedActivity.subject}`, {type: 'activity', id: updatedActivity.id}); 
  }
  async deleteActivity(id: string) {
    const activity = this.activities().find(a => a.id === id);
    if (activity) {
      await this.apiService.deleteActivity(id);
      this.activities.update(a => a.filter(x => x.id !== id));
      this.log('delete_activity', `Deleted activity: ${activity.subject}`, { type: 'activity', id });
    }
  }

  async addUser(user: User) { 
    const newUser = await this.apiService.addUser(user);
    this.users.update(u => [...u, newUser]); 
    this.log('add_user', `Invited user: ${newUser.name}`, {type: 'user', id: newUser.id}); 
  }
  async updateUser(updated: User) { 
    const updatedUser = await this.apiService.updateUser(updated);
    this.users.update(u => u.map(x => x.id === updatedUser.id ? updatedUser : x)); 
    this.log('update_user', `Updated user: ${updatedUser.name}`, {type: 'user', id: updatedUser.id}); 
  }

  async addTemplate(template: EmailTemplate) { 
      const newTemplate = await this.apiService.addTemplate(template);
      this.emailTemplates.update(t => [...t, newTemplate]); 
  }
  async updateTemplate(updated: EmailTemplate) { 
      const updatedTemplate = await this.apiService.updateTemplate(updated);
      this.emailTemplates.update(t => t.map(x => x.id === updatedTemplate.id ? updatedTemplate : x)); 
  }
  async deleteTemplate(id: string) {
    const template = this.emailTemplates().find(t => t.id === id);
    if (template) {
      await this.apiService.deleteTemplate(id);
      this.emailTemplates.update(t => t.filter(x => x.id !== id));
      this.log('delete_template', `Deleted template: ${template.name}`, { type: 'template', id });
    }
  }
  async duplicateTemplate(template: EmailTemplate) {
    const newTemplateData: EmailTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    const newTemplate = await this.apiService.addTemplate(newTemplateData);
    this.emailTemplates.update(t => [...t, newTemplate]);
    this.log('duplicate_template', `Duplicated template: ${template.name}`, { type: 'template', id: newTemplate.id });
  }


  async reassignContactOwner(contactId: string, newOwnerId: string) {
    const contact = this.contacts().find(c=>c.id===contactId);
    if (!contact) return;
    const updatedContact = { ...contact, ownerId: newOwnerId };
    await this.apiService.updateContact(updatedContact);
    this.contacts.update(contacts => contacts.map(c => c.id === contactId ? updatedContact : c));
    const newOwner = this.getUserById(newOwnerId);
    if(contact && newOwner) this.log('reassign_contact', `Reassigned contact '${contact.name}' to ${newOwner.name}`, {type: 'contact', id: contact.id});
  }
}
