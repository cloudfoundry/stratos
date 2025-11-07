import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
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

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSubNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
