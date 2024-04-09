import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../core/core.module';
import { BreadcrumbsComponent } from './breadcrumbs.component';
import { BREADCRUMB_URL_PARAM, IBreadcrumb } from './breadcrumbs.types';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let fixture: ComponentFixture<BreadcrumbsComponent>;
  let element: HTMLElement;
  let breadcrumbs: IBreadcrumb[];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, RouterTestingModule.withRoutes([])],
      declarations: [BreadcrumbsComponent],
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: {
              [BREADCRUMB_URL_PARAM]: null
            },
          },
        },
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    breadcrumbs = [
      {
        breadcrumbs: [
          { value: 'Page1', routerLink: '/link' },
          { value: 'Page2', routerLink: '/link' }
        ]
      },
      {
        key: 'key',
        breadcrumbs: [
          { value: 'Page3', routerLink: '/link' },
          { value: 'Page4', routerLink: '/link' }
        ]
      },
      {
        key: 'key-no-link',
        breadcrumbs: [
          { value: 'Page5' },
        ]
      }
    ];
    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
    component.breadcrumbs = breadcrumbs;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not filter by default', () => {
    expect(element.textContent).toContain('Page1');
    expect(element.textContent).not.toContain('Page3');
  });

  it('should filter by breadcrumb key', () => {
    component.breadcrumbKey = 'key';
    component.breadcrumbs = breadcrumbs;
    fixture.detectChanges();

    expect(element.textContent).toContain('Page3');
  });

  it('should render router link', () => {
    component.breadcrumbs = breadcrumbs;
    fixture.detectChanges();

    expect(element.querySelector('span[ng-reflect-router-link]')).toBeTruthy();
  });

  it('should not render router link', () => {
    component.breadcrumbKey = 'key-no-link';
    component.breadcrumbs = breadcrumbs;
    fixture.detectChanges();

    expect(element.querySelector('span[ng-reflect-router-link]')).toBeFalsy();
    expect(element.textContent).toContain('Page5');
  });
});
