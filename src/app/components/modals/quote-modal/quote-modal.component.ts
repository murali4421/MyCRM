
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Quote, QuoteStatus, QuoteLineItem, Opportunity, Product } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-quote-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeQuoteModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-3xl bg-gray-800 z-50 flex flex-col">
      <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Quote' : 'Edit Quote' }}</h2>
        <button (click)="uiService.closeQuoteModal()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <form #quoteForm="ngForm" (ngSubmit)="saveQuote(quoteForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300">Opportunity</label>
                <select name="opportunityId" [ngModel]="quoteModel()?.opportunityId" (ngModelChange)="onOpportunityChange($event)" required class="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 text-gray-200 border-gray-600 rounded-md text-sm">
                  <option [ngValue]="undefined" disabled>Select Opportunity</option>
                  @for(opp of dataService.opportunities(); track opp.id) {
                    <option [value]="opp.id">{{opp.name}}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Status</label>
                <select name="status" [ngModel]="quoteModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 text-gray-200 border-gray-600 rounded-md text-sm">
                    @for(status of quoteStatuses; track status) { <option [value]="status">{{status}}</option> }
                </select>
              </div>
              <div class="bg-gray-700/50 p-3 rounded-md">
                 <p class="text-xs font-medium text-gray-400">Company</p>
                 <p class="text-sm text-gray-100">{{ relatedData()?.companyName || 'Select an opportunity' }}</p>
              </div>
              <div class="bg-gray-700/50 p-3 rounded-md">
                 <p class="text-xs font-medium text-gray-400">Primary Contact</p>
                 <p class="text-sm text-gray-100">{{ relatedData()?.contactName || 'Select an opportunity' }}</p>
              </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-700">
                <h3 class="text-lg font-semibold text-gray-100 mb-4">Line Items</h3>
                <div class="space-y-3">
                    @for (item of lineItems(); track $index) {
                      <div class="grid grid-cols-12 gap-2 items-center bg-gray-900 p-2 rounded-md">
                        <div class="col-span-5">
                          <select [ngModel]="item.productId" (ngModelChange)="updateLineItem($index, 'productId', $event)" [name]="'product-' + $index" class="w-full bg-gray-700 text-gray-200 border-gray-600 rounded-md py-1.5 px-2 text-sm">
                            <option [ngValue]="undefined">Select Product</option>
                            @for(product of dataService.products(); track product.id) {
                              <option [value]="product.id">{{ product.name }}</option>
                            }
                          </select>
                        </div>
                        <div class="col-span-2"><input type="number" [ngModel]="item.quantity" (ngModelChange)="updateLineItem($index, 'quantity', $event)" [name]="'qty-' + $index" class="w-full bg-gray-700 text-gray-200 border-gray-600 rounded-md py-1.5 px-2 text-sm text-center"></div>
                        <div class="col-span-2"><input type="number" [ngModel]="item.unitPrice" [name]="'price-' + $index" class="w-full bg-gray-900 text-gray-400 rounded-md py-1.5 px-2 text-sm text-right" readonly></div>
                        <div class="col-span-2"><input type="number" [ngModel]="item.discountPercentage" (ngModelChange)="updateLineItem($index, 'discountPercentage', $event)" [name]="'disc-' + $index" class="w-full bg-gray-700 text-gray-200 border-gray-600 rounded-md py-1.5 px-2 text-sm text-center"></div>
                        <div class="col-span-1"><button type="button" (click)="removeLineItem($index)" class="text-red-400 hover:text-red-300 p-1.5 rounded-full hover:bg-red-500/10">&times;</button></div>
                      </div>
                    }
                    <button type="button" (click)="addLineItem()" class="text-sm font-medium text-indigo-400 hover:text-indigo-300">+ Add Line Item</button>
                </div>
                
                <div class="mt-6 flex justify-end">
                    <div class="w-full max-w-xs space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-gray-400">Subtotal:</span> <span class="text-gray-100 font-medium">{{ totals().subtotal | currency }}</span></div>
                        <div class="flex justify-between"><span class="text-gray-400">Discount:</span> <span class="text-gray-100 font-medium">- {{ totals().totalDiscount | currency }}</span></div>
                        <div class="flex justify-between text-lg border-t border-gray-600 pt-2 mt-2"><span class="text-gray-100 font-bold">Total:</span> <span class="text-gray-100 font-bold">{{ totals().total | currency }}</span></div>
                    </div>
                </div>
            </div>
        </div>
        <footer class="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 flex-shrink-0">
            <button type="button" (click)="uiService.closeQuoteModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
            <button type="submit" [disabled]="quoteForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Quote</button>
        </footer>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  isNew = false;
  quoteModel = signal<Partial<Quote>>({});
  quoteStatuses = Object.values(QuoteStatus);
  lineItems = signal<QuoteLineItem[]>([]);

  constructor() {
    effect(() => {
        const selectedQuote = this.uiService.selectedQuote();
        untracked(() => {
            if (selectedQuote === undefined) return;
            if (selectedQuote === null) {
                this.isNew = true;
                this.quoteModel.set({ 
                    ownerId: this.authService.currentUser()?.id,
                    status: QuoteStatus.Draft,
                });
                this.lineItems.set([]);
            } else {
                this.isNew = false;
                this.quoteModel.set({ ...selectedQuote });
                this.lineItems.set(JSON.parse(JSON.stringify(selectedQuote.lineItems || [])));
            }
        });
    });
  }

  relatedData = computed(() => {
    const oppId = this.quoteModel()?.opportunityId;
    if (!oppId) return null;
    const opp = this.dataService.opportunities().find(o => o.id === oppId);
    if (!opp) return null;
    
    const company = this.dataService.getCompanyById(opp.companyId);
    const contact = this.dataService.contacts().find(c => c.companyId === opp.companyId);

    return { companyName: company?.name, contactName: contact?.name, companyId: company?.id, contactId: contact?.id };
  });

  totals = computed(() => {
    const subtotal = this.lineItems().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = this.lineItems().reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discountPercentage / 100)), 0);
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  });

  onOpportunityChange(oppId: string) {
    this.quoteModel.update(q => ({...q, opportunityId: oppId}));
  }

  addLineItem() {
    this.lineItems.update(items => [...items, { productId: '', productName: '', quantity: 1, unitPrice: 0, discountPercentage: 0 }]);
  }

  removeLineItem(index: number) {
    this.lineItems.update(items => items.filter((_, i) => i !== index));
  }

  updateLineItem(index: number, field: keyof QuoteLineItem, value: any) {
    this.lineItems.update(items => {
        const newItems = [...items];
        const item = {...newItems[index]};
        (item[field] as any) = value;

        if (field === 'productId') {
            const product = this.dataService.products().find(p => p.id === value);
            if(product) {
                item.productName = product.name;
                item.unitPrice = product.price;
            }
        }
        if (field === 'quantity' || field === 'discountPercentage') {
            item[field] = Number(value);
        }

        newItems[index] = item;
        return newItems;
    });
  }

  async saveQuote(form: NgForm) {
    if (form.invalid) return;
    
    const related = this.relatedData();
    if (!related) {
        alert("Please select a valid opportunity.");
        return;
    }
    
    const totals = this.totals();

    const finalQuoteData = { 
        ...this.quoteModel(), 
        ...form.value,
        companyId: related.companyId,
        contactId: related.contactId,
        lineItems: this.lineItems(),
        ...totals
    };

    if (this.isNew) {
      const newQuote: Quote = {
        ...finalQuoteData,
        id: `quote-${Date.now()}`,
        quoteNumber: `Q-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      } as Quote;
      await this.dataService.addQuote(newQuote);
    } else {
      await this.dataService.updateQuote(finalQuoteData as Quote);
    }
    this.uiService.closeQuoteModal();
  }
}
