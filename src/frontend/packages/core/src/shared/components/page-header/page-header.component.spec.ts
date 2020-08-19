import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '@stratosui/store';
import { TabNavService } from '../../../tab-nav.service';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { InternalEventMonitorFactory } from '@stratosui/store';
import { SharedModule } from '../../shared.module';
import { PageHeaderComponent } from './page-header.component';
import { PageHeaderModule } from './page-header.module';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  const URL_KEY = 'key';
  beforeEach(async(() => {
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
        TabNavService
      ],
      imports: [
        MDAppModule,
        CoreModule,
        SharedModule,
        PageHeaderModule,
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
