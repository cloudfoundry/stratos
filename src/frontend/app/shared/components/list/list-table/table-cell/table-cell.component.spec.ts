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
import { ApplicationStateService } from '../../../application-state/application-state.service';
import { BooleanIndicatorComponent } from '../../../boolean-indicator/boolean-indicator.component';
import { CfRoleCheckboxComponent } from '../../../cf-role-checkbox/cf-role-checkbox.component';
import { AppChipsComponent } from '../../../chips/chips.component';
import { GithubCommitAuthorComponent } from '../../../github-commit-author/github-commit-author.component';
import { RunningInstancesComponent } from '../../../running-instances/running-instances.component';
import { UsageGaugeComponent } from '../../../usage-gauge/usage-gauge.component';
import { EventTabActorIconPipe } from '../../list-types/app-event/table-cell-event-action/event-tab-actor-icon.pipe';
import { listTableCells, TableCellComponent } from './table-cell.component';
import { ServicePlanPublicComponent } from '../../../service-plan-public/service-plan-public.component';
import { ServicePlanPriceComponent } from '../../../service-plan-price/service-plan-price.component';

describe('TableCellComponent', () => {
  let component: TableCellComponent<any>;
  let fixture: ComponentFixture<TableCellComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppActionMonitorIconComponent,
        TableCellComponent,
        ...listTableCells,
        EventTabActorIconPipe,
        ValuesPipe,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        UsageGaugeComponent,
        PercentagePipe,
        RunningInstancesComponent,
        AppChipsComponent,
        BooleanIndicatorComponent,
        CfRoleCheckboxComponent,
        GithubCommitAuthorComponent,
        ServicePlanPriceComponent,
        ServicePlanPublicComponent
      ],
      imports: [
        CoreModule
      ],
      providers: [
        ApplicationStateService,
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
