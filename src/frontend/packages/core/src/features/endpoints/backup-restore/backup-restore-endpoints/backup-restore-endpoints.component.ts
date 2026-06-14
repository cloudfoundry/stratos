import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ITileConfig, ITileData } from '../../../../shared/components/tile/tile-selector.types';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../shared/components/stepper/steppers/steppers.component';
import { StepComponent, SignalStepHandle } from '../../../../shared/components/stepper/step/step.component';
import { TileSelectorComponent } from '../../../../shared/components/tile-selector/tile-selector.component';

interface IAppTileData extends ITileData {
  type: string;
}

@Component({
  selector: 'app-backup-restore-endpoints',
  templateUrl: './backup-restore-endpoints.component.html',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    TileSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupRestoreEndpointsComponent {
  private router = inject(Router);


  public serviceType!: string;
  public tileSelectorConfig: ITileConfig<IAppTileData>[];

  // FWT-956: signal-native step handle. The tile selector is a confirmation-
  // style step (no submission, Next button hidden); the constant `valid`
  // signal exists so the step participates in the new contract identically
  // to consumers that drive validity reactively.
  signalHandle: SignalStepHandle = { valid: signal(true).asReadonly() };

  set selectedTile(tile: ITileConfig<IAppTileData>) {
    if (tile && tile.data) {
      const url = 'endpoints/backup-restore/' + tile.data.type;
      this.router.navigate(url.split('/'));
    }
  }

  constructor() {
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
