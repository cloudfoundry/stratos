import { Component, Input, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { ApplicationStateComponent } from '../../../../../../../../core/src/shared/components/application-state/application-state.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IApp } from '../../../../../../cf-api.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ApplicationStateData, ApplicationStateService } from '../../../../../services/application-state.service';

@Component({
  selector: 'app-table-cell-app-status',
  templateUrl: './table-cell-app-status.component.html',
  styleUrls: ['./table-cell-app-status.component.scss'],
  standalone: true,
  imports: [
    ApplicationStateComponent
  ]
})
export class TableCellAppStatusComponent extends TableCellCustom<APIResource<IApp>> implements OnInit {
  private appStateService = inject(ApplicationStateService);

  applicationState: ApplicationStateData;
  @Input('config')
  set config(value: { hideIcon: boolean, initialStateOnly: boolean, }) {
    super.config = value;
    value = value || {
      hideIcon: false,
      initialStateOnly: false
    };
    this.hideIcon = value.hideIcon || false;
    this.initialStateOnly = value.initialStateOnly || false;
  }
  public fetchAppState$: Observable<ApplicationStateData>;
  public hideIcon = false;
  public initialStateOnly = false;

  ngOnInit() {
    const applicationState = this.appStateService.get(this.row.entity, null);
    this.fetchAppState$ = ApplicationService.getApplicationState(
      this.appStateService,
      this.row.entity,
      this.row.metadata.guid,
      this.row.entity.cfGuid)
      .pipe(
        startWith(applicationState)
      );
  }

}
