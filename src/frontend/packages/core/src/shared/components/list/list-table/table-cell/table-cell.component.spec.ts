/* tslint:disable:max-line-length */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  CfOrgSpaceLinksComponent,
} from '../../../../../../../cloud-foundry/src/shared/components/cf-org-space-links/cf-org-space-links.component';
import {
  CfRoleCheckboxComponent,
} from '../../../../../../../cloud-foundry/src/shared/components/cf-role-checkbox/cf-role-checkbox.component';
import {
  EventTabActorIconPipe,
} from '../../../../../../../cloud-foundry/src/shared/components/list/list-types/cf-events/table-cell-event-action/event-tab-actor-icon.pipe';
import {
  RunningInstancesComponent,
} from '../../../../../../../cloud-foundry/src/shared/components/running-instances/running-instances.component';
import {
  ServicePlanPriceComponent,
} from '../../../../../../../cloud-foundry/src/shared/components/service-plan-price/service-plan-price.component';
import {
  ServicePlanPublicComponent,
} from '../../../../../../../cloud-foundry/src/shared/components/service-plan-public/service-plan-public.component';
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
import { AppChipsComponent } from '../../../chips/chips.component';
import { GithubCommitAuthorComponent } from '../../../github-commit-author/github-commit-author.component';
import { UsageGaugeComponent } from '../../../usage-gauge/usage-gauge.component';
import { listTableCells, TableCellComponent } from './table-cell.component';


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
        ServicePlanPublicComponent,
        CfOrgSpaceLinksComponent,
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
