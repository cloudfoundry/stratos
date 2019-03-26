import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { initEndpointTypes } from '../endpoint-helpers';
import { EndpointsModule } from '../endpoints.module';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog.component';

class MatDialogRefMock {
}

class MatDialogDataMock {
  guid = '57ab08d8-86cc-473a-8818-25d5e8d0ea23';
  name = 'Test';
  type = 'metrics';
  subType = null;
}

describe('ConnectEndpointDialogComponent', () => {
  let component: ConnectEndpointDialogComponent;
  let fixture: ComponentFixture<ConnectEndpointDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: MatDialogDataMock }
      ],
      declarations: [],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        createBasicStoreModule(),
        EndpointsModule
      ],
    })
      .compileComponents();
    initEndpointTypes([]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectEndpointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
