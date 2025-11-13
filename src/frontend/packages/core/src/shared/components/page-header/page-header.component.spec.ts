import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { CommonModule } from '@angular/common';

import { InternalEventMonitorFactory, appReducers } from '@stratosui/store';
import { CoreTestingModule } from '@test-framework';
import { EndpointsService } from '../../../core/endpoints.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  const URL_KEY = 'key';
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        InternalEventMonitorFactory,
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
      ],
      imports: [
        CoreTestingModule,
        CommonModule,
        RouterTestingModule,
        StoreModule.forRoot(appReducers),
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
});
