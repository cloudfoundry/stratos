import { getAPIResourceGuid } from '../../../../../store/src/selectors/api.selectors';
import { ExtensionEntitySchema } from '../../../core/extension/extension-types';

export const monocularChartsSchemaKey = 'monocularCharts';

export const helmReleasesSchemaKey = 'helmReleases';

export const monocularEntities: ExtensionEntitySchema[] = [
  {
    entityKey: monocularChartsSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  },
  {
    entityKey: helmReleasesSchemaKey,
    definition: {},
    options: { idAttribute: getAPIResourceGuid }
  }
];

export const monocularEntityKeys: string[] = [];
