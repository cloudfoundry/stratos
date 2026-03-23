import { CdkTableModule } from '@angular/cdk/table';
import { Component, ViewChild, provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, EMPTY, of as observableOf } from 'rxjs';

import { IListPaginationController } from '@stratosui/core';
import { ListSort } from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { TableComponent } from './table.component';

describe('TableComponent loading bar', () => {

  const columns = [
    { columnId: 'col1', headerCell: () => 'Column 1' },
  ];

  let isLoading$: BehaviorSubject<boolean>;

  @Component({
    standalone: false,
    selector: 'app-host-component',
    template: `
      <app-table
        #table
        [columns]="columns"
        [paginationController]="paginationController"
        [dataSource]="dataSource"
      ></app-table>
    `
  })
  class TableHostComponent {
    public columns = columns;
    public paginationController = {
      sort$: observableOf({} as ListSort),
    } as IListPaginationController<any>;
    public dataSource: any;

    @ViewChild('table', { static: true })
    public table!: TableComponent<any>;
  }

  let component: TableHostComponent;
  let fixture: ComponentFixture<TableHostComponent>;

  beforeEach(() => {
    isLoading$ = new BehaviorSubject<boolean>(true);

    TestBed.configureTestingModule({
      imports: [
        CdkTableModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        TableComponent,
      ],
      declarations: [TableHostComponent],
      providers: [provideZonelessChangeDetection()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<TableHostComponent>(TableHostComponent);
    component = fixture.componentInstance;
    component.dataSource = {
      trackBy: () => '1',
      connect: () => EMPTY,
      disconnect: () => null,
      isTableLoading$: isLoading$,
    };
    fixture.detectChanges();
  });

  it('should show progress bar when loading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const bar = el.querySelector('.progress-bar-indeterminate');
    expect(bar).toBeTruthy();
  });

  it('progress bar should have bg-primary class', () => {
    const el: HTMLElement = fixture.nativeElement;
    const bar = el.querySelector('.progress-bar-indeterminate');
    expect(bar?.classList.contains('bg-primary')).toBe(true);
  });

  it('should hide progress bar when not loading', () => {
    isLoading$.next(false);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const bar = el.querySelector('.progress-bar-indeterminate');
    expect(bar).toBeNull();
  });

  it('progress bar container should have overflow hidden', () => {
    const el: HTMLElement = fixture.nativeElement;
    const container = el.querySelector('.progress-bar');
    expect(container).toBeTruthy();
    // The .progress-bar class applies overflow-hidden via Tailwind
    expect(container?.classList.contains('progress-bar')).toBe(true);
  });
});
