import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogOutDialogComponent } from './log-out-dialog.component';
import { CoreModule } from '../core.module';
import { SharedModule } from '../../shared/shared.module';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';

describe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;

  class MatDialogRefMock {
  }

  class MatDialogDataMock {
    data: '';
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: MatDialogDataMock },
      ],
      imports: [
        CoreModule,
        SharedModule,
        MatDialogModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
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
