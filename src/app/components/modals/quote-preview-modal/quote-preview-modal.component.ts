import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { Quote } from '../../../models/crm.models';
import { LogoComponent } from '../../shared/logo/logo.component';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-quote-preview-modal',
  imports: [CommonModule, LogoComponent],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeQuotePreview()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Quote: {{ quote()?.quoteNumber }}</h2>
            <div class="flex items-center gap-2">
                <button class="text-sm font-medium px-3 py-1.5 rounded-md" [class]="themeService.c('text-base') + ' ' + themeService.c('hover:text-primary') + ' ' + themeService.c('bg-primary-hover')">Download PDF</button>
                <button (click)="uiService.closeQuotePreview()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
                    <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </header>
        <div class="p-4 sm:p-8 overflow-y-auto" [class]="themeService.c('bg-base')">
            <div class="bg-white p-6 md:p-12 text-gray-800 shadow-2xl">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-gray-200 gap-4">
                    <div>
                        <app-logo sizeClass="w-10 h-10"></app-logo>
                        <h1 class="text-3xl font-bold text-gray-900 mt-2">{{ currentUserCompany()?.name }}</h1>
                        @if(currentUserCompany(); as company) {
                            <p class="text-sm text-gray-500">
                                @if(company.addressLine1) { <span>{{ company.addressLine1 }}<br></span> }
                                @if(company.city || company.state || company.postalCode) {
                                    <span>{{ company.city }}, {{ company.state }} {{ company.postalCode }}</span>
                                }
                            </p>
                        }
                    </div>
                    <div class="w-full sm:w-auto text-left sm:text-right">
                        <h2 class="text-4xl font-bold uppercase text-gray-400">Quote</h2>
                        <p class="mt-2"><span class="font-semibold text-gray-500">Quote #:</span> {{ quote()?.quoteNumber }}</p>
                        <p><span class="font-semibold text-gray-500">Date:</span> {{ quote()?.createdAt | date:'longDate' }}</p>
                    </div>
                </div>
                <!-- Billed To -->
                <div class="py-6 flex flex-col sm:flex-row justify-between gap-4">
                     <div>
                        <p class="font-semibold text-gray-500">Quote For:</p>
                        <p class="font-bold text-lg text-gray-900">{{ company()?.name }}</p>
                        @if (company(); as clientCompany) {
                            @if(clientCompany.addressLine1) { <p class="text-gray-600">{{ clientCompany.addressLine1 }}</p> }
                            @if(clientCompany.city || clientCompany.state || clientCompany.postalCode) {
                                <p class="text-gray-600">{{ clientCompany.city }}, {{ clientCompany.state }} {{ clientCompany.postalCode }}</p>
                            }
                        }
                        <p class="text-gray-600 mt-2">{{ contact()?.name }}</p>
                        <p class="text-gray-600">{{ contact()?.email }}</p>
                    </div>
                    <div class="text-left sm:text-right">
                        <p class="font-semibold text-gray-500">Prepared By:</p>
                        <p class="text-gray-600">{{ owner()?.name }}</p>
                         <p class="text-gray-600">{{ owner()?.email }}</p>
                    </div>
                </div>
                <!-- Line Items -->
                <div class="mt-8">
                    <!-- Desktop Table View -->
                    <div class="hidden sm:block overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="p-3 font-semibold text-sm">Product/Service</th>
                                    <th class="p-3 font-semibold text-sm text-center">Qty</th>
                                    <th class="p-3 font-semibold text-sm text-right">Price</th>
                                    <th class="p-3 font-semibold text-sm text-center">Disc.</th>
                                    <th class="p-3 font-semibold text-sm text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                @for(item of quote()?.lineItems; track $index) {
                                    <tr>
                                        <td class="p-3">{{ item.productName }}</td>
                                        <td class="p-3 text-center">{{ item.quantity }}</td>
                                        <td class="p-3 text-right">{{ item.unitPrice | currency }}</td>
                                        <td class="p-3 text-center">{{ item.discountPercentage }}%</td>
                                        <td class="p-3 text-right font-semibold">{{ (item.quantity * item.unitPrice * (1 - item.discountPercentage/100)) | currency }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>

                    <!-- Mobile Card View -->
                    <div class="sm:hidden space-y-4">
                        @for(item of quote()?.lineItems; track $index) {
                            <div class="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <p class="font-bold text-gray-800">{{ item.productName }}</p>
                                <div class="mt-2 pt-2 border-t border-gray-200 space-y-1 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Details:</span>
                                        <span>{{ item.quantity }} x {{ item.unitPrice | currency }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">Discount:</span>
                                        <span>{{ item.discountPercentage }}%</span>
                                    </div>
                                    <div class="flex justify-between font-semibold mt-1 pt-1 border-t border-gray-200/50">
                                        <span class="text-gray-600">Line Total:</span>
                                        <span>{{ (item.quantity * item.unitPrice * (1 - item.discountPercentage/100)) | currency }}</span>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <!-- Totals -->
                <div class="mt-8 flex justify-end">
                    <div class="w-full max-w-sm space-y-3">
                         <div class="flex justify-between"><span class="text-gray-500">Subtotal:</span> <span class="text-gray-800 font-medium">{{ quote()?.subtotal | currency }}</span></div>
                         <div class="flex justify-between"><span class="text-gray-500">Discount:</span> <span class="text-gray-800 font-medium">- {{ quote()?.totalDiscount | currency }}</span></div>
                         <div class="flex justify-between text-xl border-t-2 border-gray-200 pt-3 mt-3"><span class="text-gray-900 font-bold">Total:</span> <span class="text-gray-900 font-bold">{{ quote()?.total | currency }}</span></div>
                    </div>
                </div>
                <!-- Footer -->
                <div class="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotePreviewModalComponent {
  uiService = inject(UiService);
  dataService = inject(DataService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  quote = this.uiService.previewingQuote;
  currentUserCompany = this.authService.currentCompany;

  company = computed(() => {
    const quoteData = this.quote();
    if (!quoteData) return null;
    return this.dataService.getCompanyById(quoteData.companyId);
  });
  
  contact = computed(() => {
    const quoteData = this.quote();
    if (!quoteData) return null;
    return this.dataService.contacts().find(c => c.id === quoteData.contactId);
  });

  owner = computed(() => {
    const quoteData = this.quote();
    if (!quoteData) return null;
    return this.dataService.getUserById(quoteData.ownerId);
  });
}
