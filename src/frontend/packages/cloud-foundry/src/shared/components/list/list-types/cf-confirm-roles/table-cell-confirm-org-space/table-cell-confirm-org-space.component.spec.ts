import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellConfirmOrgSpaceComponent } from './table-cell-confirm-org-space.component';

describe('TableCellConfirmOrgSpaceComponent', () => {
  let component: TableCellConfirmOrgSpaceComponent;
  let fixture: ComponentFixture<TableCellConfirmOrgSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TableCellConfirmOrgSpaceComponent
      ],
      declarations: [
        AppChipsComponent
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellConfirmOrgSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
