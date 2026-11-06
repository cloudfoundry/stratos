import { CnsiEntitySource } from './cnsi-entity-source';
import type { StSecurityGroup } from '../endpoint-data/stratos-types';

// Per-CNSI source for the security groups list. Reads
// /pp/v1/cf/security_groups/{cnsi} — the backend handler drains
// pagination server-side. Foundations may expose dozens of security
// groups so paging is a real case; the base class still walks
// pagination defensively client-side too.
export class CnsiSecurityGroupsSource extends CnsiEntitySource<StSecurityGroup> {
  protected readonly entityName = 'security_groups';
}
