import { appReducers } from '../../../../../store/reducers.module';
import { getInitialTestStoreState, createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppStatusComponent } from './table-cell-app-status.component';
import { AppState } from '../../../../../store/app-state';
import { ApplicationStateComponent } from '../../../../../shared/components/application-state/application-state.component';
import { ApplicationStateService } from '../../../../../shared/components/application-state/application-state.service';
import {
  ApplicationStateIconComponent
} from '../../../../../shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe
} from '../../../../../shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { CoreModule } from '../../../../../core/core.module';
import { StoreModule } from '@ngrx/store';

describe('TableCellAppStatusComponent', () => {
  let component: TableCellAppStatusComponent<any>;
  let fixture: ComponentFixture<TableCellAppStatusComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAppStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: [
        StoreModule,
        CoreModule,
        createBasicStoreModule()
      ],
      providers: [
        ApplicationStateService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
