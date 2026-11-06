import { HttpClient } from '@angular/common/http';

import { CnsiEntitySource } from './cnsi-entity-source';
import type { StAuditEvent } from '../endpoint-data/stratos-types';

// Per-CNSI source for the audit events list. Reads
// /pp/v1/cf/audit_events/{cnsi} — a per-page passthrough the handler
// orders newest-first (-created_at). Audit history is unbounded on a
// busy foundation, so unlike the catalog sources this one caps the
// drain: maxPages × pageSize = 50 × 500 = 25k newest events, the same
// ceiling the pre-passthrough backend handler enforced (#5536). The
// list is approximated as "recent activity"; deep historical retrieval
// is a future detail-screen concern.
export class CnsiAuditEventsSource extends CnsiEntitySource<StAuditEvent> {
  protected readonly entityName = 'audit_events';
  protected override readonly maxPages = 50;

  constructor(cnsiGuid: string, http: HttpClient) {
    super(cnsiGuid, http, 500);
  }
}
