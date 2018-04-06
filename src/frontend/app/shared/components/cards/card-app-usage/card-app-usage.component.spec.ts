import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../core/core.module';
import { UtilsService } from '../../../../core/utils.service';
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { PercentagePipe } from '../../../pipes/percentage.pipe';
import {
  ApplicationStateIconComponent,
} from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from '../../application-state/application-state.component';
import { ApplicationStateService } from '../../application-state/application-state.service';
import { TableCellStatusDirective } from '../../list/list-table/table-cell-status.directive';
import { CardAppStatusComponent } from '../card-app-status/card-app-status.component';
import { CardStatusComponent } from '../card-status/card-status.component';
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
