import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import { appReducers } from '../../../../../store/src/reducers.module';
import { CoreModule } from '../../../core/core.module';
import { EndpointsService } from '../../../core/endpoints.service';
import { MDAppModule } from '../../../core/md.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { SharedModule } from '../../shared.module';
import { PageHeaderComponent } from './page-header.component';
import { PageHeaderModule } from './page-header.module';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  let httpMock: HttpTestingController;
  const URL_KEY = 'key';
  const TOKEN_RESPONSE = {
    data: {
      auth_token: "auth_token_mock_value",
      refresh_token: "refresh_token_mock_value",
      token_expiry: 1753176322,
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        InternalEventMonitorFactory,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { breadcrumbs: URL_KEY }
            }
          }
        },
        TabNavService,
        CurrentUserPermissionsService,
        EndpointsService,
      ],
      imports: [
        MDAppModule,
        CoreModule,
        SharedModule,
        PageHeaderModule,
        HttpClientTestingModule,
        RouterTestingModule,
        StoreModule.forRoot(
          appReducers
        )
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 breadcrumbs', () => {
    component.breadcrumbs = [
      {
        breadcrumbs: [
          {
            value: 'test'
          },
          {
            value: 'test2'
          },
          {
            value: 'test3'
          }
        ]
      },
      {
        key: 'fake',
        breadcrumbs: [
          {
            value: 'keyed'
          }
        ]
      }
    ];
    const breadcrumbDefinitions = component.breadcrumbDefinitions;
    expect(breadcrumbDefinitions).toBeDefined();
    expect(breadcrumbDefinitions.length).toEqual(3);
  });

  it('should have 2 breadcrumb', () => {
    component.breadcrumbs = [
      {
        breadcrumbs: [
          {
            value: 'test'
          },
          {
            value: 'test2'
          },
          {
            value: 'test3'
          }
        ]
      },
      {
        key: URL_KEY,
        breadcrumbs: [
          {
            value: 'keyed'
          },
          {
            value: 'keyed123'
          }
        ]
      }
    ];
    const breadcrumbDefinitions = component.breadcrumbDefinitions;
    expect(breadcrumbDefinitions).toBeDefined();
    expect(breadcrumbDefinitions.length).toEqual(2);
  });

  it('should have an auth token', (done) => {
    component.authToken$.subscribe(data => {
      expect(data).toEqual(TOKEN_RESPONSE.data.auth_token);
      done();
    });

    const req = httpMock.expectOne('/api/v1/auth/token');
    expect(req.request.method).toBe('GET');
    req.flush(TOKEN_RESPONSE);

    fixture.detectChanges();
  })

  it('should have a refresh token', (done) => {
    component.refreshToken$.subscribe(data => {
      expect(data).toEqual(TOKEN_RESPONSE.data.refresh_token);
      done();
    });

    const req = httpMock.expectOne('/api/v1/auth/token');
    expect(req.request.method).toBe('GET');
    req.flush(TOKEN_RESPONSE);

    fixture.detectChanges();
  })

  it('should have a token expiry', (done) => {
    component.tokenExpiry$.subscribe(data => {
      expect(data).toEqual(new Date(TOKEN_RESPONSE.data.token_expiry * 1000));
      done();
    });

    const req = httpMock.expectOne('/api/v1/auth/token');
    expect(req.request.method).toBe('GET');
    req.flush(TOKEN_RESPONSE);

    fixture.detectChanges();
  })
});
