import { compose } from '@ngrx/store';

import { KubeAPIResource, Metadata } from './kube.types';


const getValueOrNull = (object, key) =>
  object ? (object[key] ? object[key] : null) : null;
export const getMetadataGuid = (metadata: Metadata): string =>
  getValueOrNull(metadata, 'uid');

export const getKubeAPIMetadata = (
  resource: KubeAPIResource
): Metadata => getValueOrNull(resource, 'metadata');

export const getKubeAPIResourceGuid = compose(
  getMetadataGuid,
  getKubeAPIMetadata
);


