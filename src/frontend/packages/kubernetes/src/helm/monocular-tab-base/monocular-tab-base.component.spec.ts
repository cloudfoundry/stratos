import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../core/src/tab-nav.service';
import { BaseTestModulesNoShared } from '../../../../core/test-framework/core-test.helper';
import { MonocularTabBaseComponent } from './monocular-tab-base.component';

describe('MonocularTabBaseComponent', () => {
  let component: MonocularTabBaseComponent;
  let fixture: ComponentFixture<MonocularTabBaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        ...BaseTestModulesNoShared,
        MonocularTabBaseComponent,
      ],
      providers: [
        
        TabNavService,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonocularTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
