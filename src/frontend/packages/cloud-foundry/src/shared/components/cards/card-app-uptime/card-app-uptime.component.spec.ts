import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
import {
  ApplicationStateService,
} from '../../../../../../core/src/shared/components/application-state/application-state.service';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { UptimePipe } from '../../../../../../core/src/shared/pipes/uptime.pipe';
import { ApplicationServiceMock } from '../../../../../../core/test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { CardAppStatusComponent } from '../card-app-status/card-app-status.component';
import { CardAppUptimeComponent } from './card-app-uptime.component';

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
