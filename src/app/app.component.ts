import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { UiService } from './services/ui.service';
import { DataService } from './services/data.service';

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
  template: `
    @if (dataService.isLoading()) {
      <div class="flex items-center justify-center h-screen bg-gray-900">
        <div class="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
        <span class="ml-4 text-lg text-gray-300">Loading CRM...</span>
      </div>
    } @else {
      @if (authService.currentUser()) {
        @switch (authService.loginAs()) {
          @case ('crm') {
            <div class="flex h-screen bg-gray-900">
              <app-sidebar></app-sidebar>
              <div class="flex-1 flex flex-col overflow-hidden">
                <app-header></app-header>
                <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
                  @if (authService.isPlanExpired() && uiService.view() !== 'dashboard') {
                    <div class="bg-gray-800 rounded-lg p-8 text-center border border-yellow-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 class="mt-4 text-2xl font-bold text-gray-100">Plan Expired</h2>
                        <p class="mt-2 text-gray-400">Your trial period has ended. Please upgrade your plan to regain full access to all CRM features.</p>
                        <button (click)="uiService.changeView('dashboard')" class="mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-md hover:bg-indigo-700 text-sm font-medium">
                            Go to Dashboard
                        </button>
                    </div>
                  } @else {
                    @if (isCurrentViewAllowed()) {
                        @switch (uiService.view()) {
                          @case ('dashboard') { <app-dashboard /> }
                          @case ('leads') { <app-leads /> }
                          @case ('companies') { <app-companies /> }
                          @case ('contacts') { <app-contacts /> }
                          @case ('opportunities') { <app-opportunities /> }
                          @case ('quotes') { <app-quotes /> }
                          @case ('cases') { <app-cases /> }
                          @case ('reports') { <app-reports /> }
                          @case ('projects') { <app-projects /> }
                          @case ('products') { <app-products /> }
                          @case ('tasks') { <app-tasks /> }
                          @case ('activities') { <app-activities /> }
                          @case ('users-roles') { <app-users-roles /> }
                          @case ('email-templates') { <app-email-templates /> }
                          @case ('audit-log') { <app-audit-log /> }
                        }
                    } @else {
                       <div class="bg-gray-800 rounded-lg p-8 text-center border border-indigo-500/30">
                            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </div>
                            <h2 class="mt-4 text-2xl font-bold text-gray-100">Upgrade to Unlock This Feature</h2>
                            <p class="mt-2 text-gray-400">This feature is not included in your current plan. Please upgrade your plan to access it.</p>
                            <button (click)="uiService.changeView('dashboard')" class="mt-6 bg-indigo-600 text-white px-5 py-2.5 rounded-md hover:bg-indigo-700 text-sm font-medium">
                                View Plans
                            </button>
                        </div>
                    }
                  }
                </main>
              </div>
            </div>

            <!-- Modals and Slide-overs -->
            @if (uiService.isProfileModalOpen()) { <app-profile-modal /> }
            @if (uiService.selectedCompany() !== undefined) { <app-company-modal /> }
            @if (uiService.selectedContact() !== undefined) { <app-contact-modal /> }
            @if (uiService.selectedOpportunity() !== undefined) { <app-opportunity-modal /> }
            @if (uiService.selectedProject() !== undefined) { <app-project-modal /> }
            @if (uiService.selectedProduct() !== undefined) { <app-product-modal /> }
            @if (uiService.editingTask() !== undefined) { <app-task-modal /> }
            @if (uiService.editingActivity() !== undefined) { <app-activity-modal /> }
            @if (uiService.autoGeneratedActivity()) { <app-activity-modal [isAutoGenerated]="true" /> }
            @if (uiService.editingUser() !== undefined) { <app-user-modal /> }
            @if (uiService.editingTemplate() !== undefined) { <app-email-template-modal /> }
            @if (uiService.previewingTemplate()) { <app-email-template-preview-modal /> }
            @if (uiService.emailComposerData().to) { <app-email-composer-modal /> }
            @if (uiService.isImportModalOpen()) { <app-import-modal /> }
            @if (uiService.activeColumnCustomization()) { <app-column-customization /> }
            @if (uiService.isUpgradeModalOpen().open) { <app-upgrade-plan-modal /> }
            @if (uiService.selectedLead() !== undefined) { <app-lead-modal /> }
            @if (uiService.leadToConvert()) { <app-lead-conversion-modal /> }
            @if (uiService.selectedQuote() !== undefined) { <app-quote-modal /> }
            @if (uiService.previewingQuote()) { <app-quote-preview-modal /> }
            @if (uiService.selectedCase() !== undefined) { <app-case-modal /> }

            <!-- Contact Popover -->
            <app-contact-popover />
          }
          @case ('superadmin') {
            <app-super-admin></app-super-admin>
          }
        }
      } @else {
        <app-auth></app-auth>
      }
    }
  `,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  authService = inject(AuthService);
  uiService = inject(UiService);
  dataService = inject(DataService);

  isCurrentViewAllowed = computed(() => {
    return this.authService.isViewAllowed(this.uiService.view());
  });
}
