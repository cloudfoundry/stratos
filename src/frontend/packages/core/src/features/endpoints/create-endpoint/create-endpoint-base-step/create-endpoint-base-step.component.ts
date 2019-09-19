import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';

import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { GeneralEntityAppState } from '../../../../../../store/src/app-state';
import { selectSessionData } from '../../../../../../store/src/reducers/auth.reducer';
import { entityCatalogue } from '../../../../core/entity-catalogue/entity-catalogue.service';
import { BASE_REDIRECT_QUERY } from '../../../../shared/components/stepper/stepper.types';
import { TileConfigManager } from '../../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';

interface ICreateEndpointTilesData extends ITileData {
  type: string;
  parentType: string;
}

@Component({
  selector: 'app-create-endpoint-base-step',
  templateUrl: './create-endpoint-base-step.component.html',
  styleUrls: ['./create-endpoint-base-step.component.scss']
})
export class CreateEndpointBaseStepComponent {

  private tileManager = new TileConfigManager();

  public tileSelectorConfig: ITileConfig<ICreateEndpointTilesData>[];

  private pSelectedTile: ITileConfig<ICreateEndpointTilesData>;
  get selectedTile() {
    return this.pSelectedTile;
  }
  set selectedTile(tile: ITileConfig<ICreateEndpointTilesData>) {
    this.pSelectedTile = tile;
    if (tile) {
      this.store.dispatch(new RouterNav({
        path: `endpoints/new/${tile.data.parentType || tile.data.type}/${tile.data.parentType ? tile.data.type : ''}`,
        query: {
          [BASE_REDIRECT_QUERY]: 'endpoints/new'
        }
      }));
    }
  }
  constructor(public store: Store<GeneralEntityAppState>, ) {
    // Need to filter the endpoint types on the tech preview flag
    store.select(selectSessionData()).pipe(
      first()
    ).subscribe(sessionData => {
      const techPreviewIsEnabled = sessionData.config.enableTechPreview || false;
      this.tileSelectorConfig = entityCatalogue.getAllEndpointTypes(techPreviewIsEnabled).map(catalogueEndpoint => {
        const endpoint = catalogueEndpoint.definition;
        return this.tileManager.getNextTileConfig<ICreateEndpointTilesData>(
          endpoint.label,
          endpoint.logoUrl ? {
            location: endpoint.logoUrl
          } : {
              matIcon: endpoint.icon,
              matIconFont: endpoint.iconFont
            },
          {
            type: endpoint.type,
            parentType: endpoint.parentType
          }
        );
      });

      // this.tileSelectorConfig = getEndpointTypes(techPreviewIsEnabled).map(et => {
      //   return this.tileManager.getNextTileConfig<ICreateEndpointTilesData>(
      //     et.label,
      //     et.imagePath ? {
      //       location: et.imagePath
      //     } : {
      //         matIcon: et.icon,
      //         matIconFont: et.iconFont
      //       },
      //     {
      //       type: et.type,
      //       subType: et.subType
      //     }
      //   );
      // });
    });


  }

}
