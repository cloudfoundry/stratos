import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../shared/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { KubernetesBaseTestModules } from '../../kubernetes/kubernetes.testing.module';
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
        Http,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        },
        PaginationMonitorFactory,
        EntityMonitorFactory,
        InternalEventMonitorFactory,
        TabNavService,
        ConfirmationDialogService
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
    httpMock.expectOne('/pp/v1/chartsvc/v1/assets/undefined/undefined/versions/undefined/values.yaml');

    expect(component).toBeTruthy();
  });

  afterEach(() => {
    httpMock.verify();
  });
});
