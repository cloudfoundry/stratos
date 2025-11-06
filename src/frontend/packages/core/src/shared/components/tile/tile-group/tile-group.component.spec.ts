import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TileGroupComponent } from './tile-group.component';

describe('TileGroupComponent', () => {
  let component: TileGroupComponent;
  let fixture: ComponentFixture<TileGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ TileGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
