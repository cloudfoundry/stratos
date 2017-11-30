import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogOutDialogComponent } from './log-out-dialog.component';
import { CoreModule } from '../core.module';
import { SharedModule } from '../../shared/shared.module';
import { MdDialogRef, MD_DIALOG_DATA, MdDialogModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';

describe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;

  class MdDialogRefMock {
  }

  class MdDialogDataMock {
    data: '';
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MdDialogRef, useClass: MdDialogRefMock },
        { provide: MD_DIALOG_DATA, useClass: MdDialogDataMock },
      ],
      imports: [
        CoreModule,
        SharedModule,
        MdDialogModule,
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
