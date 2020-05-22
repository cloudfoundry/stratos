import { ChangeDetectorRef, NgZone } from '@angular/core';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Store } from '@ngrx/store';
import { createBasicStoreModule } from '@stratos/store/testing';
import { BehaviorSubject, of as observableOf } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ListView } from '../../../../../store/src/actions/list.actions';
import { GeneralAppState } from '../../../../../store/src/app-state';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../shared.module';
import { EndpointCardComponent } from './list-types/endpoint/endpoint-card/endpoint-card.component';
import { EndpointListHelper } from './list-types/endpoint/endpoint-list.helpers';
import { EndpointsListConfigService } from './list-types/endpoint/endpoints-list-config.service';
import { ListComponent } from './list.component';
import { ListConfig, ListViewTypes } from './list.component.types';

class MockedNgZone {
  run = fn => fn();
  runOutsideAngular = fn => fn();
}

describe('ListComponent', () => {

  describe('basic tests', () => {

    function createBasicListConfig(): ListConfig<APIResource> {
      return {
        allowSelection: false,
        cardComponent: null,
        defaultView: 'table' as ListView,
        enableTextFilter: false,
        getColumns: () => null,
        getDataSource: () => null,
        getGlobalActions: () => null,
        getInitialised: () => null,
        getMultiActions: () => null,
        getMultiFiltersConfigs: () => null,
        getFilters: () => null,
        getSingleActions: () => null,
        isLocal: false,
        pageSizeOptions: [1],
        text: null,
        viewType: ListViewTypes.BOTH
      };
    }

    function setup(config: ListConfig<APIResource>, test: (component: ListComponent<APIResource>) => void) {
      TestBed.configureTestingModule({
        imports: [
          createBasicStoreModule(),
        ],
        providers: [
          { provide: ChangeDetectorRef, useValue: { detectChanges: () => { } } },
          // Fun fact, NgZone will execute something on import which causes an undefined error
          { provide: MockedNgZone, useValue: new MockedNgZone() },
          EndpointListHelper
        ]
      });
      inject([Store, ChangeDetectorRef, NgZone], (
        iStore: Store<GeneralAppState>, cd: ChangeDetectorRef, ngZone: MockedNgZone
      ) => {
        const component = new ListComponent<APIResource>(iStore, cd, config, ngZone as NgZone);
        test(component);
      })();
    }

    it('initialised - default', (done) => {
      const config = createBasicListConfig();

      config.getInitialised = null;

      setup(config, (component) => {
        const componentDeTyped = (component as any);
        spyOn<any>(componentDeTyped, 'initialise');
        expect(componentDeTyped.initialise).not.toHaveBeenCalled();

        component.ngOnInit();

        component.initialised$.subscribe(res => {
          expect(componentDeTyped.initialise).toHaveBeenCalled();
          expect(res).toBe(true);

          done();
        });
      });
    });

    it('initialised - custom', (done) => {
      const config = createBasicListConfig();
      spyOn<any>(config, 'getInitialised').and.returnValue(observableOf(true));

      setup(config, (component) => {
        const componentDeTyped = (component as any);
        spyOn<any>(componentDeTyped, 'initialise');
        expect(componentDeTyped.initialise).not.toHaveBeenCalled();

        component.ngOnInit();
        expect(config.getInitialised).toHaveBeenCalled();

        component.initialised$.subscribe(res => {
          expect(componentDeTyped.initialise).toHaveBeenCalled();
          expect(res).toBe(true);
          done();
        });
      });
    });
  });

  describe('full test bed', () => {

    let component: ListComponent<EndpointModel>;
    let fixture: ComponentFixture<ListComponent<EndpointModel>>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: ListConfig, useClass: EndpointsListConfigService },
          // ApplicationStateService,
          PaginationMonitorFactory,
          EntityMonitorFactory,
          EndpointListHelper
        ],
        imports: [
          CoreModule,
          SharedModule,
          CoreTestingModule,
          createBasicStoreModule(),
          NoopAnimationsModule
        ],
      })
        .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent<ListComponent<EndpointModel>>(ListComponent);
      component = fixture.componentInstance;
      component.columns = [];
    });

    it('should be created', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });


    describe('Header', () => {
      it('Nothing enabled', () => {
        component.config.getMultiFiltersConfigs = () => [];
        component.config.getFilters = () => [];
        component.config.enableTextFilter = false;
        component.config.viewType = ListViewTypes.CARD_ONLY;
        component.config.defaultView = 'card' as ListView;
        component.config.cardComponent = EndpointCardComponent;
        component.config.text.title = null;
        const columns = component.config.getColumns();
        columns.forEach(column => column.sort = false);
        component.config.getColumns = () => columns;
        fixture.detectChanges();

        const hostElement = fixture.nativeElement;

        // No multi filters
        const multiFilterSection: HTMLElement = hostElement.querySelector('.list-component__header__left--multi-filters');
        expect(multiFilterSection.hidden).toBeFalsy();
        expect(multiFilterSection.childElementCount).toBe(0);

        const headerRightSection = hostElement.querySelector('.list-component__header__right');
        // No text filter
        const filterSection: HTMLElement = headerRightSection.querySelector('.filter');
        expect(filterSection.hidden).toBeTruthy();

        // No sort
        const sortSection: HTMLElement = headerRightSection.querySelector('.sort');
        expect(sortSection.hidden).toBeTruthy();

        component.initialised$.pipe(
          switchMap(() => component.hasControls$)
        ).subscribe(hasControls => {
          expect(hasControls).toBeFalsy();
        });

      });

      it('Everything enabled', () => {
        component.config.getMultiFiltersConfigs = () => {
          return [
            {
              key: 'filterTestKey',
              label: 'filterTestLabel',
              list$: observableOf([
                {
                  label: 'filterItemLabel',
                  item: 'filterItemItem',
                  value: 'filterItemValue'
                },
                {
                  label: 'filterItemLabel2',
                  item: 'filterItemItem2',
                  value: 'filterItemValue2'
                }
              ]),
              loading$: observableOf(false),
              select: new BehaviorSubject(false)
            }
          ];
        };
        component.config.getFilters = () => ([
          {
            default: true,
            key: 'a',
            label: 'A',
            placeholder: 'Filter by A'
          },
          {
            key: 'b',
            label: 'B',
            placeholder: 'Filter by B'
          }
        ]);
        component.config.enableTextFilter = true;
        component.config.viewType = ListViewTypes.CARD_ONLY;
        component.config.defaultView = 'card' as ListView;
        component.config.cardComponent = EndpointCardComponent;
        component.config.getColumns = () => [
          {
            columnId: 'filterTestKey',
            headerCell: () => 'a',
            cellDefinition: {
              getValue: (row) => `${row}`
            },
            sort: true,
          }
        ];

        fixture.detectChanges();

        const hostElement = fixture.nativeElement;

        // multi filters
        const multiFilterSection: HTMLElement = hostElement.querySelector('.list-component__header__left--multi-filters');
        expect(multiFilterSection.hidden).toBeFalsy();
        expect(multiFilterSection.childElementCount).toBe(1);

        // text filter
        const headerRightSection = hostElement.querySelector('.list-component__header__right');
        const filterSection: HTMLElement = headerRightSection.querySelector('.filter');
        expect(filterSection.hidden).toBeFalsy();

        // sort - hard to test for sort, as it relies on
        // const sortSection: HTMLElement = headerRightSection.querySelector('.sort');
        // expect(sortSection.hidden).toBeFalsy();
      });

      it('First filter hidden if only one option', async(() => {
        component.config.getMultiFiltersConfigs = () => {
          return [
            {
              key: 'filterTestKey',
              label: 'filterTestLabel',
              list$: observableOf([
                {
                  label: 'filterItemLabel',
                  item: 'filterItemItem',
                  value: 'filterItemValue'
                },
              ]),
              loading$: observableOf(false),
              select: new BehaviorSubject(false)
            }
          ];
        };
        component.config.enableTextFilter = true;
        component.config.viewType = ListViewTypes.CARD_ONLY;
        component.config.defaultView = 'card' as ListView;
        component.config.cardComponent = EndpointCardComponent;
        component.config.getColumns = () => [
          {
            columnId: 'filterTestKey',
            headerCell: () => 'a',
            cellDefinition: {
              getValue: (row) => `${row}`
            },
            sort: true,
          }
        ];

        fixture.detectChanges();

        const hostElement = fixture.nativeElement;

        // multi filters
        const multiFilterSection: HTMLElement = hostElement.querySelector('.list-component__header__left--multi-filters');
        expect(multiFilterSection.hidden).toBeFalsy();
        expect(multiFilterSection.childElementCount).toBe(0);

      }));
    });


    it('No rows', () => {
      fixture.detectChanges();

      const hostElement = fixture.nativeElement;

      // No paginator
      const sortSection: HTMLElement = hostElement.querySelector('.list-component__paginator');
      expect(sortSection.hidden).toBeTruthy();

      // Shows empty message
      const noEntriesMessage: HTMLElement = hostElement.querySelector('.list-component__default-no-entries');
      expect(noEntriesMessage.hidden).toBeFalsy();
    });

  });

});
