import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { BooleanIndicatorComponent } from '@stratosui/core';
import { TableCellServiceBindableComponent } from './table-cell-service-bindable.component';

describe('TableCellServiceBindableComponent', () => {
  let component: TableCellServiceBindableComponent;
  let fixture: ComponentFixture<TableCellServiceBindableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TableCellServiceBindableComponent, BooleanIndicatorComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableCellServiceBindableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
