import { Injectable, signal } from '@angular/core';
import { AuditLog } from '../models/crm.models';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  logs = signal<AuditLog[]>([]);

  constructor() {
    this.logs.set([
        {
            id: `log-${Date.now() - 10000}`,
            timestamp: new Date(Date.now() - 10000).toISOString(),
            userId: 'user-1',
            action: 'login',
            details: 'User Alex Johnson logged in.',
            entity: { type: 'user', id: 'user-1' }
        }
    ]);
  }

  log(entry: AuditLog) {
    this.logs.update(logs => [entry, ...logs]);
  }
}
