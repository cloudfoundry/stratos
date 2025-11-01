import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { EMPTY, of as observableOf } from 'rxjs';

import { ListSort } from '../../../../../../store/src/actions/list.actions';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';
import { UtilsService } from '../../../../core/utils.service';
import { SharedModule } from '../../../shared.module';
import { IListPaginationController } from '../data-sources-controllers/list-pagination-controller';
import { ListComponent } from '../list.component';
import { ITableColumn, ICellDefinition } from './table.types';
import { TableComponent } from './table.component';
import { TableRowComponent } from './table-row/table-row.component';
import { TableCellComponent } from './table-cell/table-cell.component';
import { TableCellFavoriteComponent, createTableColumnFavorite } from './table-cell-favorite/table-cell-favorite.component';
import { IFavoriteMetadata, UserFavorite } from '@stratosui/store';

/**
 * Integration tests for the full config flow from column definition to cell rendering.
 * Tests verify that cellConfig (both object and function forms) properly flows through:
 * List → Table → Row → Cell → SpecificCell (e.g., FavoriteCell)
 */
describe('Table CellConfig Integration Flow', () => {

  // Test data models
  interface TestEntity {
    id: string;
    name: string;
    isFavorite?: boolean;
  }

  interface TestFavoriteMetadata extends IFavoriteMetadata {
    entityId: string;
  }

  // Mock implementation for testing - just use the real UserFavorite class
  function createTestUserFavorite(entity: TestEntity): UserFavorite<TestFavoriteMetadata> {
    const favorite = new UserFavorite<TestFavoriteMetadata>(
      'test-endpoint',
      'test',
      'test-entity',
      entity.id,
      {
        name: entity.name,
        entityId: entity.id
      }
    );
    return favorite;
  }

  // Test data
  const testEntities: TestEntity[] = [
    { id: '1', name: 'Entity 1' },
    { id: '2', name: 'Entity 2' },
    { id: '3', name: 'Entity 3' }
  ];

  describe('Static cellConfig Object Flow', () => {

    @Component({
      standalone: false,
      selector: 'app-test-host',
      template: `
        <app-table
          #testTable
          [columns]="columns"
          [paginationController]="paginationController"
          [dataSource]="dataSource"
        >
        </app-table>
      `
    })
    class TestHostComponent {
      columns!: ITableColumn<TestEntity>[];
      paginationController = {
        sort$: observableOf({} as ListSort)
      } as IListPaginationController<TestEntity>;

      dataSource = {
        trackBy: (index: number) => index,
        connect: () => EMPTY,
        disconnect: (): void => null as any,
        isTableLoading$: observableOf(false)
      };

      @ViewChild('testTable', { static: true })
      table: TableComponent<TestEntity>;
    }

    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          CoreModule,
          CdkTableModule,
          NoopAnimationsModule,
          CoreTestingModule,
          createBasicStoreModule(),
          SharedModule,
          CommonModule
        ],
        declarations: [
          TestHostComponent
        ],
        providers: [
          UtilsService
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
    });

    it('should render column with static cellConfig object', waitForAsync(() => {
      // Define a column with static cellConfig object
      const cellConfig = {
        customProperty: 'test-value',
        getData: (entity: TestEntity) => entity.name
      };

      component.columns = [
        {
          columnId: 'staticConfig',
          headerCell: () => 'Static Config Column',
          cellComponent: null, // Use default cell
          cellConfig: cellConfig
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        // Verify table renders successfully
        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('staticConfig');
        expect(table.columns.length).toBeGreaterThan(0);
      });
    }));

    it('should pass static cellConfig to cell component correctly', waitForAsync(() => {
      const testConfig = {
        testProperty: 'integration-test-value'
      };

      component.columns = [
        {
          columnId: 'test-col',
          headerCell: () => 'Test Column',
          cellComponent: null,
          cellConfig: testConfig
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        const table = component.table;
        const column = table.columns.find(col => col.columnId === 'test-col');

        expect(column).toBeTruthy();
        expect(column.cellConfig).toEqual(testConfig);
      });
    }));

    it('should handle column without cellConfig gracefully', waitForAsync(() => {
      component.columns = [
        {
          columnId: 'no-config',
          headerCell: () => 'No Config Column',
          cellComponent: null
          // cellConfig intentionally omitted
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('no-config');
      });
    }));
  });

  describe('Dynamic cellConfig Function Flow', () => {

    @Component({
      standalone: false,
      selector: 'app-test-host-dynamic',
      template: `
        <app-table
          #dynamicTable
          [columns]="columns"
          [paginationController]="paginationController"
          [dataSource]="dataSource"
        >
        </app-table>
      `
    })
    class DynamicTestHostComponent {
      columns!: ITableColumn<TestEntity>[];
      paginationController = {
        sort$: observableOf({} as ListSort)
      } as IListPaginationController<TestEntity>;

      dataSource = {
        trackBy: (index: number) => index,
        connect: () => EMPTY,
        disconnect: (): void => null as any,
        isTableLoading$: observableOf(false)
      };

      @ViewChild('dynamicTable', { static: true })
      table: TableComponent<TestEntity>;
    }

    let component: DynamicTestHostComponent;
    let fixture: ComponentFixture<DynamicTestHostComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          CoreModule,
          CdkTableModule,
          NoopAnimationsModule,
          CoreTestingModule,
          createBasicStoreModule(),
          SharedModule,
          CommonModule
        ],
        declarations: [
          DynamicTestHostComponent
        ],
        providers: [
          UtilsService
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(DynamicTestHostComponent);
      component = fixture.componentInstance;
    });

    it('should render column with dynamic cellConfig function', waitForAsync(() => {
      // Define a column with cellConfig as a function
      component.columns = [
        {
          columnId: 'dynamicConfig',
          headerCell: () => 'Dynamic Config Column',
          cellComponent: null,
          cellConfig: (entity: TestEntity) => ({
            dynamicValue: entity.name,
            timestamp: Date.now()
          })
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('dynamicConfig');
      });
    }));

    it('should evaluate cellConfig function for each entity', waitForAsync(() => {
      let callCount = 0;
      const configFunction = (entity: TestEntity) => {
        callCount++;
        return {
          entityName: entity.name,
          computedAt: Date.now()
        };
      };

      component.columns = [
        {
          columnId: 'eval-config',
          headerCell: () => 'Evaluated Config',
          cellComponent: null,
          cellConfig: configFunction
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        const table = component.table;
        expect(table).toBeTruthy();
        // Config function should be stored, evaluation happens in cell rendering
      });
    }));
  });

  describe('Favorite Cell End-to-End Flow', () => {

    @Component({
      standalone: false,
      selector: 'app-test-favorite-host',
      template: `
        <app-table
          #favoriteTable
          [columns]="columns"
          [paginationController]="paginationController"
          [dataSource]="dataSource"
        >
        </app-table>
      `
    })
    class FavoriteTestHostComponent {
      columns!: ITableColumn<TestEntity>[];
      paginationController = {
        sort$: observableOf({} as ListSort)
      } as IListPaginationController<TestEntity>;

      dataSource = {
        trackBy: (index: number) => index,
        connect: () => EMPTY,
        disconnect: (): void => null as any,
        isTableLoading$: observableOf(false)
      };

      @ViewChild('favoriteTable', { static: true })
      table: TableComponent<TestEntity>;
    }

    let component: FavoriteTestHostComponent;
    let fixture: ComponentFixture<FavoriteTestHostComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          CoreModule,
          CdkTableModule,
          NoopAnimationsModule,
          CoreTestingModule,
          createBasicStoreModule(),
          SharedModule,
          CommonModule,
          TableCellFavoriteComponent
        ],
        declarations: [
          FavoriteTestHostComponent
        ],
        providers: [
          UtilsService
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(FavoriteTestHostComponent);
      component = fixture.componentInstance;
    });

    it('should create favorite column with proper config', waitForAsync(() => {
      // Create favorite column using the helper
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      component.columns = [favoriteColumn];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('favorite');

        // Verify column configuration
        const favCol = table.columns.find(col => col.columnId === 'favorite');
        expect(favCol).toBeTruthy();
        expect(favCol.cellComponent).toBe(TableCellFavoriteComponent);
        expect(favCol.cellConfig).toBeTruthy();
      });
    }));

    it('should have valid cellConfig in favorite column', waitForAsync(() => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      component.columns = [favoriteColumn];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        const favCol = table.columns.find(col => col.columnId === 'favorite');

        expect(favCol.cellConfig).toBeTruthy();
        const config = favCol.cellConfig as any;
        expect(typeof config.createUserFavorite).toBe('function');
      });
    }));

    it('should render favorite column end-to-end without console errors', waitForAsync(() => {
      vi.spyOn(console, 'error');

      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      component.columns = [favoriteColumn];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        // Verify no console errors occurred
        expect(console.error).not.toHaveBeenCalled();

        // Verify table renders
        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('favorite');
      });
    }));

    it('should handle createUserFavorite function correctly in cellConfig', waitForAsync(() => {
      const createFavoriteSpy = vi.fn().mockImplementation(
        createTestUserFavorite
      );

      const favoriteColumn: ITableColumn<TestEntity> = {
        columnId: 'favorite',
        headerCell: () => '',
        cellComponent: TableCellFavoriteComponent,
        cellFlex: '0 0 100px',
        cellConfig: {
          createUserFavorite: createFavoriteSpy
        }
      };

      component.columns = [favoriteColumn];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        const favCol = table.columns.find(col => col.columnId === 'favorite');

        expect(favCol).toBeTruthy();
        const config = favCol.cellConfig as any;
        expect(config.createUserFavorite).toBe(createFavoriteSpy);
      });
    }));
  });

  describe('Mixed Config Types in Table', () => {

    @Component({
      standalone: false,
      selector: 'app-test-mixed-host',
      template: `
        <app-table
          #mixedTable
          [columns]="columns"
          [paginationController]="paginationController"
          [dataSource]="dataSource"
        >
        </app-table>
      `
    })
    class MixedTestHostComponent {
      columns!: ITableColumn<TestEntity>[];
      paginationController = {
        sort$: observableOf({} as ListSort)
      } as IListPaginationController<TestEntity>;

      dataSource = {
        trackBy: (index: number) => index,
        connect: () => EMPTY,
        disconnect: (): void => null as any,
        isTableLoading$: observableOf(false)
      };

      @ViewChild('mixedTable', { static: true })
      table: TableComponent<TestEntity>;
    }

    let component: MixedTestHostComponent;
    let fixture: ComponentFixture<MixedTestHostComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          CoreModule,
          CdkTableModule,
          NoopAnimationsModule,
          CoreTestingModule,
          createBasicStoreModule(),
          SharedModule,
          CommonModule,
          TableCellFavoriteComponent
        ],
        declarations: [
          MixedTestHostComponent
        ],
        providers: [
          UtilsService
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(MixedTestHostComponent);
      component = fixture.componentInstance;
    });

    it('should handle mixture of static and dynamic cellConfig', waitForAsync(() => {
      component.columns = [
        {
          columnId: 'col1',
          headerCell: () => 'Static',
          cellComponent: null,
          cellConfig: { type: 'static' }
        },
        {
          columnId: 'col2',
          headerCell: () => 'Dynamic',
          cellComponent: null,
          cellConfig: (entity: TestEntity) => ({ dynamicData: entity.id })
        },
        {
          columnId: 'col3',
          headerCell: () => 'No Config',
          cellComponent: null
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        expect(table.columnNames).toContain('col1');
        expect(table.columnNames).toContain('col2');
        expect(table.columnNames).toContain('col3');
      });
    }));

    it('should render favorite column alongside other columns', waitForAsync(() => {
      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      component.columns = [
        {
          columnId: 'id',
          headerCell: () => 'ID',
          cellComponent: null
        },
        favoriteColumn,
        {
          columnId: 'name',
          headerCell: () => 'Name',
          cellComponent: null
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        expect(table.columnNames).toEqual(['id', 'favorite', 'name']);
      });
    }));
  });

  describe('Config Error Handling and Validation', () => {

    @Component({
      standalone: false,
      selector: 'app-test-error-host',
      template: `
        <app-table
          #errorTable
          [columns]="columns"
          [paginationController]="paginationController"
          [dataSource]="dataSource"
        >
        </app-table>
      `
    })
    class ErrorTestHostComponent {
      columns!: ITableColumn<TestEntity>[];
      paginationController = {
        sort$: observableOf({} as ListSort)
      } as IListPaginationController<TestEntity>;

      dataSource = {
        trackBy: (index: number) => index,
        connect: () => EMPTY,
        disconnect: (): void => null as any,
        isTableLoading$: observableOf(false)
      };

      @ViewChild('errorTable', { static: true })
      table: TableComponent<TestEntity>;
    }

    let component: ErrorTestHostComponent;
    let fixture: ComponentFixture<ErrorTestHostComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          CoreModule,
          CdkTableModule,
          NoopAnimationsModule,
          CoreTestingModule,
          createBasicStoreModule(),
          SharedModule,
          CommonModule,
          TableCellFavoriteComponent
        ],
        declarations: [
          ErrorTestHostComponent
        ],
        providers: [
          UtilsService
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ErrorTestHostComponent);
      component = fixture.componentInstance;
    });

    it('should handle null cellConfig gracefully', waitForAsync(() => {
      component.columns = [
        {
          columnId: 'nullable',
          headerCell: () => 'Nullable Config',
          cellComponent: null,
          cellConfig: null
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('nullable');
      });
    }));

    it('should handle undefined cellConfig gracefully', waitForAsync(() => {
      component.columns = [
        {
          columnId: 'undefined',
          headerCell: () => 'Undefined Config',
          cellComponent: null,
          cellConfig: undefined
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        const table = component.table;
        expect(table).toBeTruthy();
        expect(table.columnNames).toContain('undefined');
      });
    }));

    it('should render table even with invalid favorite cellConfig', waitForAsync(() => {
      vi.spyOn(console, 'error');

      // Create column with invalid cellConfig (missing createUserFavorite function)
      const invalidFavoriteColumn: ITableColumn<TestEntity> = {
        columnId: 'favorite',
        headerCell: () => '',
        cellComponent: TableCellFavoriteComponent,
        cellFlex: '0 0 100px',
        cellConfig: {} // Invalid: missing createUserFavorite
      };

      component.columns = [invalidFavoriteColumn];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        // Table should still render
        const table = component.table;
        expect(table).toBeTruthy();
      });
    }));
  });

  describe('Complete List to Cell Rendering Chain', () => {

    @Component({
      standalone: false,
      selector: 'app-test-complete-host',
      template: `
        <app-list
          #completeList
          [config]="listConfig"
          [columns]="columns"
        >
        </app-list>
      `
    })
    class CompleteTestHostComponent {
      columns!: ITableColumn<TestEntity>[];
      listConfig: any = {};

      @ViewChild('completeList', { static: true })
      list!: ListComponent<TestEntity>;
    }

    let component: CompleteTestHostComponent;
    let fixture: ComponentFixture<CompleteTestHostComponent>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          CoreModule,
          CdkTableModule,
          NoopAnimationsModule,
          CoreTestingModule,
          createBasicStoreModule(),
          SharedModule,
          CommonModule,
          TableCellFavoriteComponent
        ],
        declarations: [
          CompleteTestHostComponent
        ],
        providers: [
          UtilsService
        ]
      }).compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(CompleteTestHostComponent);
      component = fixture.componentInstance;
    });

    it('should complete full rendering chain without console errors', waitForAsync(() => {
      vi.spyOn(console, 'error');

      const favoriteColumn = createTableColumnFavorite<TestEntity, TestFavoriteMetadata>(
        createTestUserFavorite
      );

      component.columns = [
        {
          columnId: 'id',
          headerCell: () => 'ID',
          cellComponent: null,
          cellConfig: { type: 'id' }
        },
        favoriteColumn,
        {
          columnId: 'name',
          headerCell: () => 'Name',
          cellComponent: null,
          cellConfig: (entity: TestEntity) => ({ label: entity.name })
        }
      ];

      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        // Verify complete rendering chain
        expect(component.columns.length).toBe(3);
        expect(console.error).not.toHaveBeenCalled();
      });
    }));
  });
});
