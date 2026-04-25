
import { Component, EventEmitter, OnDestroy, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ListComponent, ListConfig, SignalStepHandle } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IServiceBinding } from '../../../../cf-api-svc.types';
import {
  DetachAppsListConfigService,
} from '../../../../shared/components/list/list-types/detach-apps/detach-apps-list-config.service';

@Component({
  selector: 'app-detach-apps',
  templateUrl: './detach-apps.component.html',
  styleUrls: ['./detach-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListComponent
],
  providers: [
    {
      provide: ListConfig,
      useClass: DetachAppsListConfigService
    }
  ]
})
export class DetachAppsComponent implements OnDestroy {
  private config = inject(ListConfig<APIResource>);

  validate$: Observable<boolean>;
  @Output()
  public selectedApps = new EventEmitter<APIResource<IServiceBinding>[]>();
  selectedSub: Subscription;

  // FWT-957: signal-native step handle. Validity is "at least one app
  // selected"; no submit (the parent's confirm step handles the actual
  // detach), so the step auto-succeeds on Next.
  signalHandle: SignalStepHandle;

  constructor() {
    this.selectedSub = this.config.getDataSource().selectedRows$.subscribe(
      (selectedApps) => {
        this.selectedApps.emit(Array.from(selectedApps.values()));
      }
    );

    this.validate$ = this.config.getDataSource().selectedRows$.pipe(
      map(rows => Array.from(rows.values()).length > 0)
    );

    const validSignal = toSignal(this.validate$.pipe(startWith(false)), { initialValue: false });
    this.signalHandle = { valid: validSignal };
  }

  ngOnDestroy() {
    this.selectedSub.unsubscribe();
  }

  onNext = () => observableOf({ success: true });

}
