import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { SidePanelService } from '../../../../services/side-panel.service';
import { TableCellSidePanelComponent } from './table-cell-side-panel.component';

describe('TableCellSidePanelComponent', () => {
  let component: TableCellSidePanelComponent;
  let fixture: ComponentFixture<TableCellSidePanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      providers: [
        SidePanelService,
      ],
      imports: [
        RouterTestingModule,
        TableCellSidePanelComponent
      ]
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
