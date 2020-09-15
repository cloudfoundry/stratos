// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { EntityMonitorFactory } from '../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { MockChartService } from '../../../helm/monocular/shared/services/chart.service.mock';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { ConfigService } from '../../../helm/monocular/shared/services/config.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { CreateReleaseComponent } from './create-release.component';

describe('CreateReleaseComponent', () => {
  let component: CreateReleaseComponent;
  let fixture: ComponentFixture<CreateReleaseComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateReleaseComponent,
      ],
      imports: [
        KubernetesBaseTestModules,
        HttpClientTestingModule,
      ],
      providers: [
        HttpClient,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        InternalEventMonitorFactory,
        TabNavService,
        ConfirmationDialogService,
        { provide: ChartsService, useValue: new MockChartService() },
        { provide: ConfigService, useValue: { appName: 'appName' } },
      ]
    })
      .compileComponents();

    httpMock = TestBed.get(HttpTestingController);

  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    httpMock.verify();
  });
});
