import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { UiService } from './services/ui.service';
import { DataService } from './services/data.service';
import { ThemeService } from './services/theme.service';

// Layout components
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

// Page components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CompaniesComponent } from './components/companies/companies.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { ActivitiesComponent } from './components/activities/activities.component';
import { UsersRolesComponent } from './components/users-roles/users-roles.component';
import { EmailTemplatesComponent } from './components/email-templates/email-templates.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProductsComponent } from './components/products/products.component';
import { LeadsComponent } from './components/leads/leads.component';
import { QuotesComponent } from './components/quotes/quotes.component';
import { CasesComponent } from './components/cases/cases.component';
import { ReportsComponent } from './components/reports/reports.component';

// Auth component
import { AuthComponent } from './components/auth/auth.component';

// Modal components
import { ProfileModalComponent } from './components/modals/profile-modal/profile-modal.component';
import { CompanyModalComponent } from './components/modals/company-modal/company-modal.component';
import { ContactModalComponent } from './components/modals/contact-modal/contact-modal.component';
import { OpportunityModalComponent } from './components/modals/opportunity-modal/opportunity-modal.component';
import { TaskModalComponent } from './components/modals/task-modal/task-modal.component';
import { ActivityModalComponent } from './components/modals/activity-modal/activity-modal.component';
import { UserModalComponent } from './components/modals/user-modal/user-modal.component';
import { EmailTemplateModalComponent } from './components/modals/email-template-modal/email-template-modal.component';
import { EmailComposerModalComponent } from './components/modals/email-composer-modal/email-composer-modal.component';
import { ImportModalComponent } from './components/modals/import-modal/import-modal.component';
import { ColumnCustomizationComponent } from './components/modals/column-customization/column-customization.component';
import { EmailTemplatePreviewModalComponent } from './components/modals/email-template-preview-modal/email-template-preview-modal.component';
import { ContactPopoverComponent } from './components/shared/contact-popover/contact-popover.component';
import { ProjectModalComponent } from './components/modals/project-modal/project-modal.component';
import { ProductModalComponent } from './components/modals/product-modal/product-modal.component';
import { SuperAdminComponent } from './components/super-admin/super-admin.component';
import { UpgradePlanModalComponent } from './components/modals/upgrade-plan-modal/upgrade-plan-modal.component';
import { LeadModalComponent } from './components/modals/lead-modal/lead-modal.component';
import { LeadConversionModalComponent } from './components/modals/lead-conversion-modal/lead-conversion-modal.component';
import { QuoteModalComponent } from './components/modals/quote-modal/quote-modal.component';
import { QuotePreviewModalComponent } from './components/modals/quote-preview-modal/quote-preview-modal.component';
import { CaseModalComponent } from './components/modals/case-modal/case-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    DashboardComponent,
    CompaniesComponent,
    ContactsComponent,
    OpportunitiesComponent,
    TasksComponent,
    ActivitiesComponent,
    UsersRolesComponent,
    EmailTemplatesComponent,
    AuditLogComponent,
    ProjectsComponent,
    ProductsComponent,
    LeadsComponent,
    QuotesComponent,
    CasesComponent,
    ReportsComponent,
    AuthComponent,
    ProfileModalComponent,
    CompanyModalComponent,
    ContactModalComponent,
    OpportunityModalComponent,
    TaskModalComponent,
    ActivityModalComponent,
    UserModalComponent,
    EmailTemplateModalComponent,
    EmailComposerModalComponent,
    ImportModalComponent,
    ColumnCustomizationComponent,
    EmailTemplatePreviewModalComponent,
    ContactPopoverComponent,
    ProjectModalComponent,
    ProductModalComponent,
    SuperAdminComponent,
    UpgradePlanModalComponent,
    LeadModalComponent,
    LeadConversionModalComponent,
    QuoteModalComponent,
    QuotePreviewModalComponent,
    CaseModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'themeService.c("bg-base") + " " + themeService.c("text-base")'
  },
})
export class AppComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  dataService = inject(DataService);
  themeService = inject(ThemeService);

  isCurrentViewAllowed = computed(() => {
    return this.authService.isViewAllowed(this.uiService.view());
  });
}