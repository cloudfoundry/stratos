import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import {
  BaseEndpointTileManager,
  ICreateEndpointTilesData,
} from '../../../../../core/src/features/endpoints/create-endpoint/create-endpoint-base-step/base-endpoint-tile-manager';
import { BASE_REDIRECT_QUERY } from '../../../../../core/src/shared/components/stepper/stepper.types';
import { ITileConfig } from '../../../../../core/src/shared/components/tile/tile-selector.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { GeneralEntityAppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/public-api';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { GIT_ENDPOINT_SUB_TYPES, GIT_ENDPOINT_TYPE } from '../../../store/git-entity-factory';
import { GitSCMService } from '../../scm/scm.service';

@Component({
  selector: 'app-git-registration',
  templateUrl: './git-registration.component.html',
  styleUrls: ['./git-registration.component.scss']
})
export class GitRegistrationComponent extends BaseEndpointTileManager {

  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    super.selectedTile = tile;

    if (tile) {
      let skipRegister = false;
      switch (tile.data.type) {
        case GIT_ENDPOINT_SUB_TYPES.PUBLIC_GITHUB:
          // TODO: RC should there be some kind of warning/feedback for this?
          stratosEntityCatalog.endpoint.api.register(
            tile.data.parentType,
            tile.data.type,
            'Public Github',
            this.gitSCMService.getSCM('github').getAPIUrl(),
            false // TODO: RC handle error
          );
          this.store.dispatch(new RouterNav({ path: `endpoints` }));
          break;
        case GIT_ENDPOINT_SUB_TYPES.PRIVATE_GITHUB:
          // TODO: RC should there be some kind of warning/feedback for this?
          stratosEntityCatalog.endpoint.api.register(
            tile.data.parentType,
            tile.data.type,
            'Private Github',
            this.gitSCMService.getSCM('github').getAPIUrl(),
            false // TODO: RC handle error
          );
          // Request creds
          // Go to endpoints page
          skipRegister = true; // TODO: Wire in to endpoints/new to go straight to connect step
          break;
        case GIT_ENDPOINT_SUB_TYPES.PUBLIC_GITLAB:
          // Register public gitlab api url as endpoint (and handle errors)
          stratosEntityCatalog.endpoint.api.register(
            tile.data.parentType,
            tile.data.type,
            'Public Gitlab',
            this.gitSCMService.getSCM('gitlab').getAPIUrl(),
            false // TODO: RC handle error
          );
          // Go to endpoints page
          this.store.dispatch(new RouterNav({ path: `endpoints` }));
          break;

        case GIT_ENDPOINT_SUB_TYPES.PRIVATE_GITLAB:
          // Register private gitlab api url as endpoint (and handle errors)
          stratosEntityCatalog.endpoint.api.register(
            tile.data.parentType,
            tile.data.type,
            'Private Gitlab',
            this.gitSCMService.getSCM('gitlab').getAPIUrl(),
            false // TODO: RC handle error
          );
          // Request creds
          // Go to endpoints page
          skipRegister = true; // TODO: Wire in to endpoints/new to go straight to connect step
          break;
        default: {
          // GIT_ENDPOINT_SUB_TYPES.PUBLIC_GIT:
          // GIT_ENDPOINT_SUB_TYPES.PRIVATE_GIT:
          // This will take the user on the usual register endpoint step... and if there's auth configured the connect step
          this.store.dispatch(new RouterNav({
            path: `endpoints/new/${tile.data.parentType || tile.data.type}/${tile.data.parentType ? tile.data.type : ''}`,
            query: {
              [BASE_REDIRECT_QUERY]: 'endpoints/new'
            }
          }));
          break;
        }
      }
    }
  }

  private gitSCMService: GitSCMService;

  constructor(
    store: Store<GeneralEntityAppState>,
    gitSCMService: GitSCMService
  ) {
    // Avoid gitEntityCatalog due to circular loops
    const types = entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE).definition.subTypes
      .map(subType => entityCatalog.getEndpoint(GIT_ENDPOINT_TYPE, subType.type));
    // .map(endpoint => ({ // TODO: RC BUG hide the types on first screen.
    //   ...endpoint,
    // }));
    super(of(types), store);
    this.gitSCMService = gitSCMService;
  }

}
