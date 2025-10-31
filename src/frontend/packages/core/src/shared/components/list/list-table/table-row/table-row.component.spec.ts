import { CdkTableModule } from '@angular/cdk/table';
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of as observableOf } from 'rxjs';

import { CoreModule } from '../../../../../core/core.module';
import { ITableColumn } from '../table.types';
import { TableCellComponent } from '../table-cell/table-cell.component';
import { TableRowExpandedService } from './table-row-expanded-service';
import { TableRowComponent } from './table-row.component';


describe('TableRowComponent', () => {

  @Component({
    standalone: false,
    selector: `app-host-component`,
    template: `
    <app-table-row [rowState]="rowState1"></app-table-row>
    <app-table-row [rowState]="rowState2"></app-table-row>
    `
  })
  class TestHostComponent {
    rowState1 = observableOf({
      error: true,
      blocked: true,
      message: 'Error message'
    });
    rowState2 = observableOf({
      error: false,
      blocked: false
    });
  }

  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  const getElements = (className: string) => ([
    fixture.elementRef.nativeElement.getElementsByClassName(className)[0],
    fixture.elementRef.nativeElement.getElementsByClassName(className)[1]
  ]);
  const elementShown = (element: Element) => element && window.getComputedStyle(element).display !== 'none';


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({

      declarations: [
        TestHostComponent
      ],
      imports: [
        CoreModule,
        CdkTableModule,
        NoopAnimationsModule,
        TableRowComponent
      ],
      providers: [
        TableRowExpandedService
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error', waitForAsync(() => {
    fixture.detectChanges();
    const [error1, error2] = getElements('table-row__error');
    const errorShown = elementShown(error1);
    const errorNotShown = !elementShown(error2);

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(errorNotShown).toBeTruthy();
      expect(errorShown).toBeTruthy();
    });
  }));

  describe('Config binding', () => {
    let configFixture: ComponentFixture<TableRowComponent>;
    let configComponent: TableRowComponent;

    // Mock custom cell component for testing
    @Component({
      standalone: true,
      selector: 'app-mock-cell',
      template: '<div>{{config?.testValue}}</div>'
    })
    class MockCellComponent {
      config: any;
    }

    beforeEach(() => {
      configFixture = TestBed.createComponent(TableRowComponent);
      configComponent = configFixture.componentInstance;
    });

    it('should pass static cellConfig object to table-cell component', () => {
      // Arrange
      const staticConfig = { testValue: 'static-value', enabled: true };
      const columns: ITableColumn<any>[] = [
        {
          columnId: 'test',
          cellComponent: MockCellComponent,
          cellConfig: staticConfig
        }
      ];
      const testRow = { id: 1, name: 'Test Row' };

      configComponent.columns = columns;
      configComponent.row = testRow;
      configComponent.dataSource = {} as any;

      // Act
      configFixture.detectChanges();

      // Assert
      const tableCellDebug: DebugElement = configFixture.debugElement.query(By.directive(TableCellComponent));
      expect(tableCellDebug).toBeTruthy('TableCellComponent should be rendered');

      const tableCellInstance = tableCellDebug.componentInstance as TableCellComponent<any>;
      expect(tableCellInstance.config).toEqual(staticConfig);
      expect(tableCellInstance.config).not.toBe(columns[0]); // Should not be entire column
    });

    it('should evaluate cellConfig function with row data', () => {
      // Arrange
      const configFunction = vi.fn().mockImplementation((row: any) => ({
        testValue: `dynamic-${row.id}`,
        enabled: row.active
      }));

      const columns: ITableColumn<any>[] = [
        {
          columnId: 'test',
          cellComponent: MockCellComponent,
          cellConfig: configFunction
        }
      ];
      const testRow = { id: 42, name: 'Test Row', active: true };

      configComponent.columns = columns;
      configComponent.row = testRow;
      configComponent.dataSource = {} as any;

      // Act
      configFixture.detectChanges();

      // Assert
      expect(configFunction).toHaveBeenCalledWith(testRow);
      const tableCellDebug: DebugElement = configFixture.debugElement.query(By.directive(TableCellComponent));
      const tableCellInstance = tableCellDebug.componentInstance as TableCellComponent<any>;

      expect(tableCellInstance.config).toEqual({
        testValue: 'dynamic-42',
        enabled: true
      });
    });

    it('should handle missing cellConfig gracefully', () => {
      // Arrange
      const columns: ITableColumn<any>[] = [
        {
          columnId: 'test',
          cellComponent: MockCellComponent
          // cellConfig is undefined
        }
      ];
      const testRow = { id: 1, name: 'Test Row' };

      configComponent.columns = columns;
      configComponent.row = testRow;
      configComponent.dataSource = {} as any;

      // Act & Assert - should not throw
      expect(() => {
        configFixture.detectChanges();
      }).not.toThrow();

      const tableCellDebug: DebugElement = configFixture.debugElement.query(By.directive(TableCellComponent));
      const tableCellInstance = tableCellDebug.componentInstance as TableCellComponent<any>;
      expect(tableCellInstance.config).toBeUndefined();
    });

    it('should handle null cellConfig gracefully', () => {
      // Arrange
      const columns: ITableColumn<any>[] = [
        {
          columnId: 'test',
          cellComponent: MockCellComponent,
          cellConfig: null
        }
      ];
      const testRow = { id: 1, name: 'Test Row' };

      configComponent.columns = columns;
      configComponent.row = testRow;
      configComponent.dataSource = {} as any;

      // Act & Assert - should not throw
      expect(() => {
        configFixture.detectChanges();
      }).not.toThrow();

      const tableCellDebug: DebugElement = configFixture.debugElement.query(By.directive(TableCellComponent));
      const tableCellInstance = tableCellDebug.componentInstance as TableCellComponent<any>;
      expect(tableCellInstance.config).toBeNull();
    });

    it('should re-evaluate function config when row changes', () => {
      // Arrange
      const configFunction = vi.fn().mockImplementation((row: any) => ({
        testValue: `row-${row.id}`
      }));

      const columns: ITableColumn<any>[] = [
        {
          columnId: 'test',
          cellComponent: MockCellComponent,
          cellConfig: configFunction
        }
      ];

      configComponent.columns = columns;
      configComponent.row = { id: 1 };
      configComponent.dataSource = {} as any;

      // Act - Initial render
      configFixture.detectChanges();
      expect(configFunction).toHaveBeenCalledTimes(1);

      // Change row
      configComponent.row = { id: 2 };
      configFixture.detectChanges();

      // Assert - Function should be called again with new row
      expect(configFunction).toHaveBeenCalledTimes(2);
      expect(configFunction).toHaveBeenCalledWith({ id: 2 });
    });

    it('should not pass entire column object as config', () => {
      // Arrange
      const columns: ITableColumn<any>[] = [
        {
          columnId: 'test',
          cellComponent: MockCellComponent,
          cellConfig: { testValue: 'correct-config' },
          cellFlex: '1 1 100px', // Other column properties
          sort: true
        }
      ];
      const testRow = { id: 1 };

      configComponent.columns = columns;
      configComponent.row = testRow;
      configComponent.dataSource = {} as any;

      // Act
      configFixture.detectChanges();

      // Assert
      const tableCellDebug: DebugElement = configFixture.debugElement.query(By.directive(TableCellComponent));
      const tableCellInstance = tableCellDebug.componentInstance as TableCellComponent<any>;

      // Config should only contain cellConfig, not have columnId, cellFlex, sort, etc.
      expect(tableCellInstance.config).toEqual({ testValue: 'correct-config' });
      expect((tableCellInstance.config as any)?.columnId).toBeUndefined();
      expect((tableCellInstance.config as any)?.cellFlex).toBeUndefined();
      expect((tableCellInstance.config as any)?.sort).toBeUndefined();
    });
  });
});
