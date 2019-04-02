import { Component, OnInit } from '@angular/core';
import { TileConfigManager } from '../../../shared/components/tile/tile-selector.helpers';
import { ITileConfig, ITileData } from '../../../shared/components/tile/tile-selector.types';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/src/app-state';
import { BASE_REDIRECT_QUERY } from '../../../shared/components/stepper/stepper.types';
interface IAppTileData extends ITileData {
  type: string;
}
@Component({
  selector: 'app-new-application-base-step',
  templateUrl: './new-application-base-step.component.html',
  styleUrls: ['./new-application-base-step.component.scss']
})
export class NewApplicationBaseStepComponent implements OnInit {

  public serviceType: string;

  public tileSelectorConfig = [
    new ITileConfig<IAppTileData>(
      'Deploy',
      { matIcon: 'file_upload' },
      { type: 'deploy' },
    ),
    new ITileConfig<IAppTileData>(
      'Application Shell',
      { matIcon: 'border_clear' },
      { type: 'create' }
    )
  ];

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    const type = tile ? tile.data.type : null;
    if (tile) {
      const baseUrl = 'applications';
      this.store.dispatch(new RouterNav({
        path: `${baseUrl}/${type}`,
        query: {
          [BASE_REDIRECT_QUERY]: `${baseUrl}/new`
        }
      }));
    }
  }

  constructor(public store: Store<AppState>) { }

  ngOnInit() {
  }

}
