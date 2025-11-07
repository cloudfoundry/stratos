import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Type, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityInfo } from '@stratosui/store';
import { IListDataSource, CardCell } from '@stratosui/core';
import { CardsComponent } from './cards.component';

describe('CardsComponent', () => {
  let component: CardsComponent<EntityInfo>;
  let fixture: ComponentFixture<CardsComponent<EntityInfo>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CardsComponent, // Standalone component
        NoopAnimationsModule,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CardsComponent<EntityInfo>>(CardsComponent);
    component = fixture.componentInstance;
    component.component = {} as Type<CardCell<EntityInfo>>;
    component.dataSource = {} as IListDataSource<EntityInfo>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
