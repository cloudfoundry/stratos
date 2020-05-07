import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../core/core.module';
import { UtilsService } from '../../../../../core/utils.service';
import { PercentagePipe } from '../../../../pipes/percentage.pipe';
import { ValuesPipe } from '../../../../pipes/values.pipe';
import { AppActionMonitorIconComponent } from '../../../app-action-monitor-icon/app-action-monitor-icon.component';
import {
  ApplicationStateIconComponent,
} from '../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from '../../../application-state/application-state.component';
import { BooleanIndicatorComponent } from '../../../boolean-indicator/boolean-indicator.component';
import { AppChipsComponent } from '../../../chips/chips.component';
import { UsageGaugeComponent } from '../../../usage-gauge/usage-gauge.component';
import { listTableCells, TableCellComponent } from './table-cell.component';

/* tslint:disable:max-line-length */

/* tslint:enable:max-line-length */

describe('TableCellComponent', () => {
  let component: TableCellComponent<any>;
  let fixture: ComponentFixture<TableCellComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppActionMonitorIconComponent,
        TableCellComponent,
        ...listTableCells,
        // EventTabActorIconPipe,
        ValuesPipe,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        UsageGaugeComponent,
        PercentagePipe,
        // RunningInstancesComponent,
        AppChipsComponent,
        BooleanIndicatorComponent,
        // CfRoleCheckboxComponent,
        // GithubCommitAuthorComponent,
        // ServicePlanPriceComponent,
        // ServicePlanPublicComponent,
        // CfOrgSpaceLinksComponent,
        // ServiceInstanceLastOpComponent
      ],
      imports: [
        CoreModule
      ],
      providers: [
        UtilsService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
