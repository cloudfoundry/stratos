import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppUsageComponent } from './card-app-usage.component';
import { CardStatusComponent } from '../card-status/card-status.component';
import { ApplicationStateComponent } from '../../application-state/application-state.component';
import { ApplicationStateIconComponent } from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { CoreModule } from '../../../../core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { ApplicationStateService } from '../../application-state/application-state.service';
import { CardAppStatusComponent } from '../card-app-status/card-app-status.component';
import { TableCellAppStatusComponent } from '../../list/table/custom-cells/table-cell-app-status/table-cell-app-status.component';
import { PercentagePipe } from '../../../pipes/percentage.pipe';
import { UtilsService } from '../../../../core/utils.service';
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { TableCellStatusDirective } from '../../list/table/table-cell-status.directive';

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
        CoreModule,
        BrowserAnimationsModule,
        createBasicStoreModule(),
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
