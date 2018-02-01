import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CardAppUptimeComponent } from './card-app-uptime.component';
import { CardAppStatusComponent } from '../card-app-status/card-app-status.component';
import { CardStatusComponent } from '../../../card-status/card-status.component';
import { ApplicationStateComponent } from '../../../application-state/application-state.component';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../../core/core.module';
import { ApplicationStateIconComponent } from '../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { TableCellAppStatusComponent } from '../../../table/custom-cells/table-cell-app-status/table-cell-app-status.component';
import { TableCellStatusDirective } from '../../../table/table-cell-status.directive';
import { ApplicationStateService } from '../../../application-state/application-state.service';
import { UtilsService } from '../../../../../core/utils.service';
import { ApplicationMonitorService } from '../../../../../features/applications/application-monitor.service';
import { UptimePipe } from '../../../../pipes/uptime.pipe';
import { MetadataItemComponent } from '../../../metadata-item/metadata-item.component';

describe('CardAppUptimeComponent', () => {
  let component: CardAppUptimeComponent;
  let fixture: ComponentFixture<CardAppUptimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppUptimeComponent,
        CardAppStatusComponent,
        CardStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        TableCellAppStatusComponent,
        TableCellStatusDirective,
        UptimePipe,
        MetadataItemComponent,
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
    fixture = TestBed.createComponent(CardAppUptimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
