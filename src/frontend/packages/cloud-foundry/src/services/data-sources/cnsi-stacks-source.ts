import { CnsiEntitySource } from './cnsi-entity-source';
import type { StStack } from '../endpoint-data/stratos-types';

// Per-CNSI source for the stacks list. Reads /pp/v1/cf/stacks/{cnsi}
// — the backend handler drains pagination server-side. CF foundations
// typically expose <10 stacks so a single page is the common case, but
// the base class still walks pagination defensively.
export class CnsiStacksSource extends CnsiEntitySource<StStack> {
  protected readonly entityName = 'stacks';
}
