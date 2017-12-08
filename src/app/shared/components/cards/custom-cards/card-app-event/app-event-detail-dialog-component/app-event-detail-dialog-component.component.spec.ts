import { EntityInfo } from '../../../../../../store/types/api.types';
import { CoreModule } from '../../../../../../core/core.module';
import { ValuesPipe } from '../../../../../pipes/values.pipe';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppEventDetailDialogComponentComponent } from './app-event-detail-dialog-component.component';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { RequestInfoState } from '../../../../../../store/reducers/api-request-reducer/types';

describe('AppEventDetailDialogComponentComponent', () => {
  let component: AppEventDetailDialogComponentComponent;
  let fixture: ComponentFixture<AppEventDetailDialogComponentComponent>;

  class MdDialogRefMock {
  }

  class MdDialogDataMock {
    row = {
      entity: {
        metadata: {}
      },
      entityRequestInfo: {} as RequestInfoState
    };
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MdDialogRef, useClass: MdDialogRefMock },
        { provide: MD_DIALOG_DATA, useClass: MdDialogDataMock },
      ],
      declarations: [
        AppEventDetailDialogComponentComponent,
        ValuesPipe
      ],
      imports: [
        CoreModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppEventDetailDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
