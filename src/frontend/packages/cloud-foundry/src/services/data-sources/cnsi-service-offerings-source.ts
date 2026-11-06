import { CnsiEntitySource } from './cnsi-entity-source';
import type { StServiceOffering } from '../endpoint-data/stratos-types';

// Per-CNSI source for the service offerings catalog. Reads
// /pp/v1/cf/service_offerings/{cnsi}, which the backend handler fully
// drains server-side — the marketplace catalog is small enough that we
// don't bother with summary-tier paging. The CnsiEntitySource base class
// still walks pagination defensively in case CAPI/Jetstream ever surfaces
// per_page-bounded responses; backend always returns a single fully drained
// page today.
export class CnsiServiceOfferingsSource extends CnsiEntitySource<StServiceOffering> {
  protected readonly entityName = 'service_offerings';
}
