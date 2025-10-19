export enum OpportunityStage {
  Prospecting = 'Prospecting',
  Qualification = 'Qualification',
  NeedsAnalysis = 'Needs Analysis',
  ValueProposition = 'Value Proposition',
  Proposal = 'Proposal',
  Negotiation = 'Negotiation',
  ClosedWon = 'Closed - Won',
  ClosedLost = 'Closed - Lost',
}

export enum LeadStatus {
    New = 'New',
    Contacted = 'Contacted',
    Qualified = 'Qualified',
    Disqualified = 'Disqualified'
}

export enum QuoteStatus {
    Draft = 'Draft',
    Sent = 'Sent',
    Accepted = 'Accepted',
    Declined = 'Declined'
}

export enum CaseStatus {
    New = 'New',
    InProgress = 'In Progress',
    OnHold = 'On Hold',
    Resolved = 'Resolved',
    Closed = 'Closed'
}

export enum CasePriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent'
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  createdAt: string;
  logoUrl?: string;
  planId: string;
  expiryDate?: string | null;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  ownerId: string;
  createdAt: string;
  roleInCompany?: string;
  leadScore?: 'Hot' | 'Warm' | 'Cold';
}

export interface Opportunity {
  id: string;
  name: string;
  companyId: string;
  stage: OpportunityStage;
  value: number;
  closeDate: string;
  ownerId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  ownerId: string;
  relatedEntity?: RelatedEntity;
  completed: boolean;
  createdAt: string;
  dependsOnTaskId?: string | null;
}

export interface Activity {
  id: string;
  type: 'Call summary' | 'Email' | 'Meeting' | 'Note';
  subject: string;
  description: string;
  startTime: string;
  endTime: string;
  ownerId: string;
  relatedEntity?: RelatedEntity;
  status: 'Done' | 'Planned';
  participants?: string[]; // user or contact ids
}

export interface AutoActivity {
    subject: string;
    description: string;
    type: 'Call summary' | 'Email' | 'Meeting' | 'Note';
    relatedEntity?: RelatedEntity;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  companyId: string;
  status: 'Active' | 'Inactive' | 'Invited';
  profilePictureUrl: string;
  jobTitle?: string;
  managerId?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface RelatedEntity {
  type: 'company' | 'contact' | 'opportunity';
  id: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  entity: {
    type: string;
    id: string;
  };
}

export interface Project {
    id: string;
    name: string;
    companyId: string;
    status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
    budget: number;
    startDate: string;
    endDate: string;
    ownerId: string;
    description: string;
    createdAt: string;
}

export interface Product {
    id: string;
    name: string;
    category: 'Software' | 'Service' | 'Hardware' | 'Consulting';
    price: number;
    description: string;
    ownerId: string; // The user who created it
    createdAt: string;
}

export interface ServicePlanFeatures {
    taskManagement: boolean;
    aiAssistant: boolean;
    auditLog: boolean;
    projects: boolean;
    products: boolean;
    leads: boolean;
    quotes: boolean;
    cases: boolean;
    reports: boolean;
}

export interface ServicePlan {
    id: string;
    name: string;
    monthlyPrice: number;
    biannualPrice: number;
    yearlyPrice: number;
    userLimit: number; // -1 for unlimited
    contactLimit: number; // -1 for unlimited
    opportunityLimit: number; // -1 for unlimited
    companyLimit: number; // -1 for unlimited
    features: ServicePlanFeatures;
    isDefault: boolean;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    link?: {
        view: AppView;
        entityType: string;
        entityId: string;
    };
    isRead: boolean;
    createdAt: string;
}

export type AppView =
  | 'dashboard'
  | 'companies'
  | 'contacts'
  | 'opportunities'
  | 'tasks'
  | 'activities'
  | 'users-roles'
  | 'email-templates'
  | 'audit-log'
  | 'projects'
  | 'products'
  | 'leads'
  | 'quotes'
  | 'cases'
  | 'reports';

export type AuthView = 'login' | 'signup';
export type ProfileView = 'personal-info' | 'password' | 'notifications';
export type UsersAndRolesView = 'users' | 'roles' | 'team';
export type SuperAdminView = 'dashboard' | 'plans';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

export type ImportableEntity = 'companies' | 'contacts' | 'opportunities' | 'tasks';

export interface QuoteLineItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    opportunityId: string;
    companyId: string;
    contactId: string;
    status: QuoteStatus;
    ownerId: string;
    createdAt: string;
    lineItems: QuoteLineItem[];
    subtotal: number;
    totalDiscount: number;
    total: number;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    status: LeadStatus;
    ownerId: string;
    source: string;
    createdAt: string;
}

export interface Case {
    id: string;
    caseNumber: string;
    subject: string;
    description: string;
    contactId: string;
    companyId: string;
    status: CaseStatus;
    priority: CasePriority;
    ownerId: string;
    createdAt: string;
}