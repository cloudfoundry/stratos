import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA } from '@stratosui/core';
import { TailwindSnackBarRef } from '../../services/tailwind-snackbar.service';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { SnackBarReturnComponent } from './snackbar-return.component';

describe('SnackBarReturnComponent', () => {
  let component: SnackBarReturnComponent;
  let fixture: ComponentFixture<SnackBarReturnComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SnackBarReturnComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [{
        provide: TailwindSnackBarRef,
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
