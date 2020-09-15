import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBinding } from '../../../../cf-api-svc.types';
import {
  DetachAppsListConfigService,
} from '../../../../shared/components/list/list-types/detach-apps/detach-apps-list-config.service';

@Component({
  selector: 'app-detach-apps',
  templateUrl: './detach-apps.component.html',
  styleUrls: ['./detach-apps.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: DetachAppsListConfigService
    }
  ]
})
export class DetachAppsComponent implements OnDestroy {

  validate$: Observable<boolean>;
  @Output()
  public selectedApps = new EventEmitter<APIResource<IServiceBinding>[]>();
  selectedSub: Subscription;
  constructor(private config: ListConfig<APIResource>) {
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
