import { getAPIResourceGuid } from '../../../../../store/src/selectors/api.selectors';
import { ExtensionEntitySchema } from '../../../core/extension/extension-types';
import { HelmReleasePod, HelmReleaseService, HelmReleaseStatus, HelmVersion } from './helm.types';

export const monocularChartsSchemaKey = 'monocularCharts';

export const helmReleasesSchemaKey = 'helmReleases';
export const helmVersionsSchemaKey = 'helmVersions';
export const helmReleaseStatusSchemaKey = 'helmReleaseStatus';
export const helmReleasePod = 'helmReleasePod';
export const helmReleaseService = 'helmReleaseService';

export const monocularEntities: ExtensionEntitySchema[] = [
  {
    entityKey: monocularChartsSchemaKey,
    definition: {},
    // TODO: RC Is this correct?
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: helmReleasesSchemaKey,
    definition: {},
    // TODO: RC Is this correct?
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: helmVersionsSchemaKey,
    definition: {},
    options: { idAttribute: (entity: HelmVersion) => entity.endpointId }
  },
  {
    entityKey: helmReleaseStatusSchemaKey,
    definition: {},
    options: { idAttribute: (entity: HelmReleaseStatus) => entity.endpointGuid }
  },
  {
    entityKey: helmReleasePod,
    definition: {},
    // TODO: RC Fix
    options: { idAttribute: (entity: HelmReleasePod) => entity.name }
  },
  {
    entityKey: helmReleaseService,
    definition: {},
    // TODO: RC Fix
    options: { idAttribute: (entity: HelmReleaseService) => entity.name }
  }
];

export const monocularEntityKeys: string[] = [];
