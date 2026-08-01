// Minimal St* entity builders for foundation-shape specs.
import { StApp, StOrg, StSpace } from '../../../services/endpoint-data/stratos-types';

export const org = (guid: string): StOrg => ({
  guid,
  name: `org-${guid}`,
  status: 'active',
  quotaGuid: '',
  labels: {},
  annotations: {},
  createdAt: '',
  updatedAt: '',
  cnsiGuid: 'cnsi-1',
});

export const space = (guid: string, orgGuid: string): StSpace => ({
  guid,
  name: `space-${guid}`,
  orgGuid,
  createdAt: '',
  updatedAt: '',
  cnsiGuid: 'cnsi-1',
  appCount: 0,
  routeCount: 0,
  allowSsh: false,
});

export const app = (guid: string, overrides: Partial<StApp>): StApp => ({
  guid,
  name: `app-${guid}`,
  state: 'STARTED',
  spaceGuid: '',
  instances: 1,
  routes: [],
  createdAt: '',
  updatedAt: '',
  cnsiGuid: 'cnsi-1',
  ...overrides,
});
