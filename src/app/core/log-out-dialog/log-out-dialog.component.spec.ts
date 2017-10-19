import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogOutDialogComponent } from './log-out-dialog.component';
import { CoreModule } from '../core.module';
import { SharedModule } from '../../shared/shared.module';
import { MdDialogRef, MD_DIALOG_DATA, MdDialogModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../store/reducers.module';
import { getInitialTestStoreState } from '../../test-framework/store-test-helper';

fdescribe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;

  class MdDialogRefMock {
  }

  // class MD_DIALOG_DATA {
  //   data: '';
  // }

  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MdDialogRef, useClass: MdDialogRefMock },
      ],
      imports: [
        CoreModule,
        SharedModule,
        MdDialogModule,
        NoopAnimationsModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          })
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogOutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
