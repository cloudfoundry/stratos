import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { createBasicStoreModule } from '../../../../../../../../core/test-framework/store-test-helper';
import { TableCellAppNameComponent } from './table-cell-app-name.component';

describe('TableCellAppNameComponent', () => {
  let component: TableCellAppNameComponent<any>;
  let fixture: ComponentFixture<TableCellAppNameComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellAppNameComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppNameComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
