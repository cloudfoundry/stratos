import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppChipsComponent } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { TableCellRouteAppsAttachedComponent } from './table-cell-route-apps-attached.component';

describe('TableCellRouteAppsAttachedComponent', () => {
  let component: TableCellRouteAppsAttachedComponent;
  let fixture: ComponentFixture<TableCellRouteAppsAttachedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...generateCfBaseTestModulesNoShared(),
        AppChipsComponent,
        TableCellRouteAppsAttachedComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellRouteAppsAttachedComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        apps: [],
        domain_guid: 'test',
        space_guid: 'test'
      },
      metadata: null,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
