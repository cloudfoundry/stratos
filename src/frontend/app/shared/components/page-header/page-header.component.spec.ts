import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { MDAppModule } from '../../../core/md.module';
import { appReducers } from '../../../store/reducers.module';
import { PageHeaderComponent } from './page-header.component';
import { CoreModule } from '../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { PageHeaderModule } from './page-header.module';
import { SharedModule } from '../../shared.module';
import { InternalEventMonitorFactory } from '../../monitors/internal-event-monitor.factory';

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
        }],
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
    fixture.detectChanges();
    const breadcrumbs = fixture.elementRef.nativeElement.getElementsByClassName('page-header__breadcrumb');
    expect(breadcrumbs.length).toEqual(3);
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
    fixture.detectChanges();
    const breadcrumbs = fixture.elementRef.nativeElement.getElementsByClassName('page-header__breadcrumb');
    expect(breadcrumbs.length).toEqual(2);
  });
});
