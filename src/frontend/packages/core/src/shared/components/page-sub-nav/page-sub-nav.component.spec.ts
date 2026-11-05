import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../tab-nav.service';
import { PageSubNavComponent } from './page-sub-nav.component';

describe('PageSubNavComponent', () => {
  let component: PageSubNavComponent;
  let fixture: ComponentFixture<PageSubNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        PageSubNavComponent,
      ],
      providers: [
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(PageSubNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('publishes nothing while no breadcrumbs are bound', () => {
    expect(TestBed.inject(TabNavService).tabSubNavBreadcrumbs()).toBeUndefined();
  });

  it('publishes its breadcrumbs to the dashboard', async () => {
    const crumbs = [{ value: 'Reports', routerLink: '/reports' }, { value: 'Report' }];
    fixture.componentRef.setInput('breadcrumbs', crumbs);
    await fixture.whenStable();

    expect(TestBed.inject(TabNavService).tabSubNavBreadcrumbs()).toBe(crumbs);
  });
});
