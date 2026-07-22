import { CnsiEntitySource } from './cnsi-entity-source';
import type { StAuditEvent } from '../endpoint-data/stratos-types';

// Per-CNSI source for the audit events list. Reads
// /pp/v1/cf/audit_events/{cnsi} — the backend handler drains pagination
// up to maxAuditEventPages (50 pages × 500 events = 25k events) so
// busy foundations stay bounded. The list is approximated as "recent
// activity"; deep historical retrieval is a future detail-screen
// concern.
export class CnsiAuditEventsSource extends CnsiEntitySource<StAuditEvent> {
  protected readonly entityName = 'audit_events';
}
