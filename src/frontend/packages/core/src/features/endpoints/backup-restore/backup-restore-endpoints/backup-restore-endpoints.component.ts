import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState, RouterNav } from '@stratosui/store';

import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';

interface IAppTileData extends ITileData {
  type: string;
}

@Component({
  selector: 'app-backup-restore-endpoints',
  templateUrl: './backup-restore-endpoints.component.html',
  styleUrls: ['./backup-restore-endpoints.component.scss'],
})
export class BackupRestoreEndpointsComponent {

  public serviceType: string;
  public tileSelectorConfig: ITileConfig<IAppTileData>[];

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    if (tile) {
      const url = 'endpoints/backup-restore/' + tile.data.type;
      this.store.dispatch(new RouterNav({ path: url }));
    }
  }

  constructor(
    private store: Store<AppState>) {
    this.tileSelectorConfig = [
      new ITileConfig<IAppTileData>(
        'Backup',
        { matIcon: 'cloud_download' },
        { type: 'backup' }
      ),
      new ITileConfig<IAppTileData>(
        'Restore',
        { matIcon: 'cloud_upload' },
        { type: 'restore' }
      )
    ];
  }

}
