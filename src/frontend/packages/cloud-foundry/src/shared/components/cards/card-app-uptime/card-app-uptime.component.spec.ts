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
  CopyToClipboardComponent,
} from '../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { UptimePipe } from '../../../../../../core/src/shared/pipes/uptime.pipe';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationMonitorService } from '../../../../features/applications/application-monitor.service';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationStateService } from '../../../services/application-state.service';
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
        CopyToClipboardComponent,
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
    fixture = TestBed.createComponent(CardAppUptimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
