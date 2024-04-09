import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellConfirmOrgSpaceComponent } from './table-cell-confirm-org-space.component';

describe('TableCellConfirmOrgSpaceComponent', () => {
  let component: TableCellConfirmOrgSpaceComponent;
  let fixture: ComponentFixture<TableCellConfirmOrgSpaceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        NoopAnimationsModule
      ],
      declarations: [
        TableCellConfirmOrgSpaceComponent,
        AppChipsComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellConfirmOrgSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
