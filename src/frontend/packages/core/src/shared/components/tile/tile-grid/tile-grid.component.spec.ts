import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TileGridComponent } from './tile-grid.component';

describe('TileGridComponent', () => {
  let component: TileGridComponent;
  let fixture: ComponentFixture<TileGridComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TileGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
