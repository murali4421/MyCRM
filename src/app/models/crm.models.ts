export type AppView = 'dashboard' | 'companies' | 'contacts' | 'opportunities' | 'tasks' | 'activities' | 'users-roles' | 'email-templates' | 'audit-log' | 'projects' | 'products';
export type AuthView = 'login' | 'signup' | 'forgotPassword' | 'resetPassword';
export type ProfileView = 'personal-info' | 'password' | 'notifications';
export type UsersAndRolesView = 'users' | 'roles' | 'team';

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  ownerId: string;
  roleInCompany?: string;
  createdAt: string;
  leadScore?: 'Hot' | 'Warm' | 'Cold';
}

export enum OpportunityStage {
  Prospecting = 'Prospecting',
  Qualification = 'Qualification',
  Proposal = 'Proposal',
  Negotiation = 'Negotiation',
  ClosedWon = 'Closed - Won',
  ClosedLost = 'Closed - Lost',
}

export interface Opportunity {
  id: string;
  name: string;
  companyId: string;
  stage: OpportunityStage;
  value: number;
  closeDate: string; // YYYY-MM-DD
  ownerId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  ownerId: string;
  relatedEntity?: RelatedEntity;
  completed: boolean;
  dependsOnTaskId?: string | null;
  createdAt: string;
}

export interface RelatedEntity {
  type: 'contact' | 'company' | 'opportunity';
  id: string;
}

export interface Activity {
  id: string;
  type: 'Call summary' | 'Email' | 'Meeting' | 'Note';
  subject: string;
  description: string;
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  status: 'Done' | 'Scheduled';
  ownerId: string;
  relatedEntity?: RelatedEntity;
  // Meeting/Call specific
  participants?: string[]; // array of contact IDs
  location?: string;
}

export interface AutoActivity {
  id: string | null;
  subject: string;
  description: string;
  type: 'Call summary' | 'Email' | 'Meeting' | 'Note';
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  managerId?: string;
  status: 'Active' | 'Inactive' | 'Invited';
  profilePictureUrl: string;
  jobTitle?: string;
}

export interface Role {
  id: string;
  name: 'Admin' | 'Manager' | 'Sales Rep';
  permissions: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  budget: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  ownerId: string;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Software' | 'Service' | 'Hardware' | 'Consulting';
  price: number;
  createdAt: string;
  ownerId: string;
}


export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

export type ImportableEntity = 'companies' | 'contacts' | 'opportunities' | 'tasks';

export interface AuditLog {
    id: string;
    timestamp: string; // ISO date string
    userId: string;
    action: string; // e.g., 'created_contact', 'updated_company'
    details: string; // e.g., "Created contact 'John Doe'"
    entity: {
      type: string; // 'contact', 'company'
      id: string;
    };
  }