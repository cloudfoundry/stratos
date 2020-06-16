import { Action } from '@ngrx/store';

import { IRequestEntityTypeState } from '../../../../../../store/src/app-state';
import { HelmRelease } from '../workload.types';
import {
  UPDATE_HELM_RELEASE,
  UPDATE_HELM_RELEASE_MANIFEST_ERROR,
  UpdateHelmReleaseManifestError,
} from './workloads.actions';

const defaultState = {};

export function helmReleaseReducer(state = defaultState, action) {
  switch (action.type) {
    case UPDATE_HELM_RELEASE:
      return {
        ...state,
      };

  }
}

const createDefaultHelmRelease = (
  endpointGuid: string,
  guid: string,
  name: string,
  namespace: string
): HelmRelease => ({
  chart: null,
  config: null,
  endpointId: endpointGuid,
  firstDeployed: null,
  guid,
  info: null,
  lastDeployed: null,
  manifestError: false,
  name,
  namespace,
  status: null,
  version: null
})
export function helmReleaseEntityReducer() {
  return (state: IRequestEntityTypeState<HelmRelease>, action: Action): IRequestEntityTypeState<HelmRelease> => {
    switch (action.type) {
      case UPDATE_HELM_RELEASE_MANIFEST_ERROR:
        const updateErrorAction = action as UpdateHelmReleaseManifestError;
        const release: HelmRelease = state[updateErrorAction.guid] || createDefaultHelmRelease(
          updateErrorAction.endpointGuid,
          updateErrorAction.guid,
          updateErrorAction.releaseTitle,
          updateErrorAction.namespace
        );
        if (release.manifestError !== updateErrorAction.manifestError) {
          return {
            ...state,
            [updateErrorAction.guid]: {
              ...state[updateErrorAction.guid],
              manifestError: updateErrorAction.manifestError
            }
          }
        }
    }
    return state;
  };
}
