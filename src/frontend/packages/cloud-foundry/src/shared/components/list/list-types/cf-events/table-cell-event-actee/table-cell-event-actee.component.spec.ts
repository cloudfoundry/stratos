import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  CopyToClipboardComponent,
} from '../../../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { BaseTestModulesNoShared } from '../../../../../../../../core/test-framework/core-test.helper';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { TableCellEventActeeComponent } from './table-cell-event-actee.component';

describe('TableCellEventActeeComponent', () => {
  let component: TableCellEventActeeComponent;
  let fixture: ComponentFixture<TableCellEventActeeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellEventActeeComponent,
        CopyToClipboardComponent
      ],
      imports: [
        ...BaseTestModulesNoShared
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEventActeeComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} } as APIResource;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
