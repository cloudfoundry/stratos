import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { MAT_SNACK_BAR_DATA } from '@stratosui/core';
import { TailwindSnackBarRefImpl } from '../../services/tailwind-snackbar.service';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { SnackBarReturnComponent } from './snackbar-return.component';

describe('SnackBarReturnComponent', () => {
  let component: SnackBarReturnComponent;
  let fixture: ComponentFixture<SnackBarReturnComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SnackBarReturnComponent,
        ...BaseTestModulesNoShared
      ],
      providers: [{
        provide: TailwindSnackBarRefImpl,
        useValue: {}
      }, {
        provide: MAT_SNACK_BAR_DATA,
        useValue: { message: '', returnUrl: '' }
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnackBarReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
