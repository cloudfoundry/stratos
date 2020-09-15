import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { UtilsService } from '../../../../../../core/src/core/utils.service';
import {
  ApplicationStateIconComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  ApplicationStateComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state.component';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import {
  TableCellStatusDirective,
} from '../../../../../../core/src/shared/components/list/list-table/table-cell-status.directive';
import { PercentagePipe } from '../../../../../../core/src/shared/pipes/percentage.pipe';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationStateService } from '../../../services/application-state.service';
import { CardAppStatusComponent } from '../card-app-status/card-app-status.component';
import { CardAppUsageComponent } from './card-app-usage.component';

describe('CardAppUsageComponent', () => {
  let component: CardAppUsageComponent;
  let fixture: ComponentFixture<CardAppUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppUsageComponent,
        CardAppStatusComponent,
        CardStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        PercentagePipe,
        TableCellStatusDirective,
      ],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        UtilsService,
        ApplicationMonitorService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
