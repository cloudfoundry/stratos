// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { TabNavService } from '../../../../tab-nav.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
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
        HttpClient,
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
