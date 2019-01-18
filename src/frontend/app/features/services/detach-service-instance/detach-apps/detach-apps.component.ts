import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { DetachAppsListConfigService } from '../../../../shared/components/list/list-types/detach-apps/detach-apps-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { IServiceBinding } from '../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../store/types/api.types';
import { of as observableOf, Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
