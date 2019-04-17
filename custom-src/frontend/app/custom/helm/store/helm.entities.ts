import { ExtensionEntitySchema } from '../../../core/extension/extension-types';
import {
  HelmRelease,
  HelmReleasePod,
  HelmReleaseService,
  HelmReleaseStatus,
  HelmVersion,
  MonocularChart,
} from './helm.types';

export const monocularChartsSchemaKey = 'monocularCharts';

export const helmReleaseSchemaKey = 'helmReleases';
export const helmVersionsSchemaKey = 'helmVersions';
export const helmReleaseStatusSchemaKey = 'helmReleaseStatus';
export const helmReleasePodKey = 'helmReleasePod';
export const helmReleaseServiceKey = 'helmReleaseService';

export const getMonocularChartId = (entity: MonocularChart) => entity.id;
export const getHelmReleaseId = (entity: HelmRelease) => entity.endpointId;
export const getHelmVersionId = (entity: HelmVersion) => entity.endpointId;
export const getHelmReleaseStatusId = (entity: HelmReleaseStatus) => entity.endpointId;
export const getHelmReleasePodId = (entity: HelmReleasePod) => entity.name;
export const getHelmReleaseServiceId = (entity: HelmReleaseService) => entity.name;

export const monocularEntities: ExtensionEntitySchema[] = [
  {
    entityKey: monocularChartsSchemaKey,
    definition: {},
    options: { idAttribute: getMonocularChartId }
  },
  {
    entityKey: helmReleaseSchemaKey,
    definition: {},
    options: { idAttribute: getHelmReleaseId }
  },
  {
    entityKey: helmVersionsSchemaKey,
    definition: {},
    options: { idAttribute: getHelmVersionId }
  },
  {
    entityKey: helmReleaseStatusSchemaKey,
    definition: {},
    options: { idAttribute: getHelmReleaseStatusId }
  },
  {
    entityKey: helmReleasePodKey,
    definition: {},
    options: { idAttribute: getHelmReleasePodId }
  },
  {
    entityKey: helmReleaseServiceKey,
    definition: {},
    options: { idAttribute: getHelmReleaseServiceId }
  }
];

export const monocularEntityKeys: string[] = [
  monocularChartsSchemaKey,
  helmReleaseSchemaKey,
  helmVersionsSchemaKey,
  helmReleaseStatusSchemaKey,
  helmReleasePodKey,
  helmReleaseServiceKey
];
