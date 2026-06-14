import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';

import { CoreTestingModule } from '@test-framework';
import { EndpointsService } from '../../../core/endpoints.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { SnackBarService } from '../../services/snackbar.service';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  const URL_KEY = 'key';
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { breadcrumbs: URL_KEY },
              data: {}
            }
          }
        },
        TabNavService,
        CurrentUserPermissionsService,
        EndpointsService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        CoreTestingModule,
        CommonModule,
        RouterTestingModule,
        PageHeaderComponent,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
    // strict: asserted defined above; setting breadcrumbs populates breadcrumbDefinitions
    expect(breadcrumbDefinitions!.length).toEqual(3);
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
    // strict: asserted defined above; setting breadcrumbs populates breadcrumbDefinitions
    expect(breadcrumbDefinitions!.length).toEqual(2);
  });

  describe('copyToken (UAA token menu)', () => {
    let httpMock: HttpTestingController;
    let writeTextMock: ReturnType<typeof vi.fn>;
    let snackSpy: ReturnType<typeof vi.spyOn>;
    const tokenUrl = `/api/${environment.proxyAPIVersion}/auth/token`;

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);

      writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const snack = TestBed.inject(SnackBarService);
      snackSpy = vi.spyOn(snack, 'show');
    });

    afterEach(() => {
      httpMock.verify();
      vi.restoreAllMocks();
    });

    it('toggleTokenMenu flips isTokenMenuOpen and closes the other menus', () => {
      component.isHistoryMenuOpen = true;
      component.isUserMenuOpen = true;
      component.toggleTokenMenu();

      expect(component.isTokenMenuOpen).toBe(true);
      expect(component.isHistoryMenuOpen).toBe(false);
      expect(component.isUserMenuOpen).toBe(false);

      component.closeTokenMenu();
      expect(component.isTokenMenuOpen).toBe(false);
    });

    it('copyToken copies the auth token value and shows a success snackbar', async () => {
      component.toggleTokenMenu();

      const promise = component.copyToken(component.authToken$, 'Auth token');
      const req = httpMock.expectOne(tokenUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        status: 'ok',
        error: '',
        data: { auth_token: 'auth-123', refresh_token: 'refresh-456', token_expiry: 1700000000 },
      });
      await promise;

      expect(writeTextMock).toHaveBeenCalledWith('auth-123');
      expect(snackSpy).toHaveBeenCalledWith('Auth token copied to clipboard', 'Close');
    });

    it('copyToken copies the refresh token value and shows a success snackbar', async () => {
      component.toggleTokenMenu();

      const promise = component.copyToken(component.refreshToken$, 'Refresh token');
      httpMock.expectOne(tokenUrl).flush({
        status: 'ok',
        error: '',
        data: { auth_token: 'auth-123', refresh_token: 'refresh-456', token_expiry: 1700000000 },
      });
      await promise;

      expect(writeTextMock).toHaveBeenCalledWith('refresh-456');
      expect(snackSpy).toHaveBeenCalledWith('Refresh token copied to clipboard', 'Close');
    });

    it('copyToken shows a "no value" snackbar when the token is empty', async () => {
      component.toggleTokenMenu();

      const promise = component.copyToken(component.authToken$, 'Auth token');
      httpMock.expectOne(tokenUrl).flush({
        status: 'error',
        error: 'no session',
        data: null,
      });
      await promise;

      expect(writeTextMock).not.toHaveBeenCalled();
      expect(snackSpy).toHaveBeenCalledWith('No Auth token available', 'Close');
    });

    it('copyToken shows a failure snackbar when the clipboard write rejects', async () => {
      writeTextMock.mockRejectedValueOnce(new Error('denied'));
      component.toggleTokenMenu();

      const promise = component.copyToken(component.authToken$, 'Auth token');
      httpMock.expectOne(tokenUrl).flush({
        status: 'ok',
        error: '',
        data: { auth_token: 'auth-123', refresh_token: 'refresh-456', token_expiry: 1700000000 },
      });
      await promise;

      expect(writeTextMock).toHaveBeenCalledWith('auth-123');
      expect(snackSpy).toHaveBeenCalledWith('Failed to copy Auth token', 'Close');
    });
  });
});
