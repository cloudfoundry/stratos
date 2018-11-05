import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmComponent } from './dialog-confirm.component';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { RequestInfoState } from '../../../store/reducers/api-request-reducer/types';

describe('DialogConfirmComponent', () => {
  let component: DialogConfirmComponent;
  let fixture: ComponentFixture<DialogConfirmComponent>;

  class MatDialogRefMock {
  }

  class MatDialogDataMock {
    row = {
      entity: {
        metadata: {}
      },
      entityRequestInfo: {} as RequestInfoState
    };
  }
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DialogConfirmComponent],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: MatDialogDataMock },
      ],
      imports: [
        CommonModule,
        CoreModule,
        BrowserAnimationsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
