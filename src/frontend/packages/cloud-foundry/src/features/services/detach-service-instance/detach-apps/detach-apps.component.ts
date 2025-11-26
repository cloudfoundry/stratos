
import { Component, EventEmitter, type OnDestroy, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { type Observable, of as observableOf, type Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListComponent, ListConfig } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IServiceBinding } from '../../../../cf-api-svc.types';
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

  constructor() {
    this.selectedSub = this.config.getDataSource().selectedRows$.subscribe(
      (selectedApps) => {
        this.selectedApps.emit(Array.from(selectedApps.values()));
      }
    );

    this.validate$ = this.config.getDataSource().selectedRows$.pipe(
      map(rows => Array.from(rows.values()).length > 0)
    );
  }

  ngOnDestroy() {
    this.selectedSub.unsubscribe();
  }

  onNext = () => observableOf({ success: true });

}
