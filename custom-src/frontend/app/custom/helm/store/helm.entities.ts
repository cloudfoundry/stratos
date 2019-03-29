import { getAPIResourceGuid } from '../../../../../store/src/selectors/api.selectors';
import { ExtensionEntitySchema } from '../../../core/extension/extension-types';

export const monocularChartsSchemaKey = 'monocularCharts';

export const helmReleasesSchemaKey = 'helmReleases';
export const helmVersionsSchemaKey = 'helmVersions';

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
    options: { idAttribute: (entity) => entity.endpointId }
  }
];

export const monocularEntityKeys: string[] = [];
