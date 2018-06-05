import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { DetachAppsListConfigService } from '../../list/list-types/detach-apps/detach-apps-list-config.service';
import { ListConfig } from '../../list/list.component.types';
import { IServiceBinding } from '../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../store/types/api.types';
import { Subscription } from 'rxjs/Subscription';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';

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
  @Output('selectedApps')
  public selectedApps = new EventEmitter<APIResource<IServiceBinding>[]>();
  selectedSub: Subscription;
  constructor(private config: ListConfig<APIResource>) {
    const dataSource = this.config.getDataSource();

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

  onNext = () => Observable.of({ success: true });

}
