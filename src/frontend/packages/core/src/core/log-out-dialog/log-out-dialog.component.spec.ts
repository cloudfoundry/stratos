import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../test-framework/core-test.modules';
import { SharedModule } from '../../shared/shared.module';
import { CoreModule } from '../core.module';
import { LogOutDialogComponent } from './log-out-dialog.component';

describe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;
  let element: HTMLElement;
  let store: any;

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
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogOutDialogComponent);
    store = TestBed.get(Store);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch logout action after countdown', fakeAsync(() => {
    const spy = spyOn(store, 'dispatch');

    component.data = {
      expiryDate: Date.now() + 1000,
    };
    fixture.detectChanges();
    component.ngOnDestroy();
    component.ngOnInit();

    expect(spy).not.toHaveBeenCalled();
    tick(1500);
    expect(spy).toHaveBeenCalled();
  }));

  afterEach(() => {
    fixture.destroy();
  });
});
