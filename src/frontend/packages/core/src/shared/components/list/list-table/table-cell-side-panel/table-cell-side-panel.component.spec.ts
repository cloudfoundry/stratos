import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SidePanelService } from '../../../../services/side-panel.service';
import { TableCellSidePanelComponent } from './table-cell-side-panel.component';

describe('TableCellSidePanelComponent', () => {
  let component: TableCellSidePanelComponent;
  let fixture: ComponentFixture<TableCellSidePanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellSidePanelComponent],
      providers: [
        SidePanelService,
      ],
      imports: [
        RouterTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
