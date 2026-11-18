import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellConfirmOrgSpaceComponent } from './table-cell-confirm-org-space.component';

describe('TableCellConfirmOrgSpaceComponent', () => {
  let component: TableCellConfirmOrgSpaceComponent;
  let fixture: ComponentFixture<TableCellConfirmOrgSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        AppChipsComponent,
        NoopAnimationsModule,
        TableCellConfirmOrgSpaceComponent,
      ],
      
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellConfirmOrgSpaceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('row', { orgName: 'acme', orgGuid: 'o1' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels the chip with the space when the change is for a space, else with the org', () => {
    expect(component.chipsConfig().map(chip => chip.value)).toEqual(['Org: acme']);

    fixture.componentRef.setInput('row', { orgName: 'acme', orgGuid: 'o1', spaceName: 'dev', spaceGuid: 's1' });
    expect(component.chipsConfig().map(chip => chip.value)).toEqual(['Space: dev']);
  });
});
