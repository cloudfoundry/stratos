import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { SnackBarReturnComponent } from './snackbar-return.component';

describe('SnackBarReturnComponent', () => {
  let component: SnackBarReturnComponent;
  let fixture: ComponentFixture<SnackBarReturnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SnackBarReturnComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [{
        provide: MatSnackBarRef,
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
