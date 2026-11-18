import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TileGroupComponent } from './tile-group.component';
import { TileComponent } from '../tile/tile.component';

@Component({
  template: `
    <app-tile-group>
      <app-tile></app-tile>
      <app-tile></app-tile>
      @if (third()) {
        <app-tile></app-tile>
      }
    </app-tile-group>`,
  imports: [TileGroupComponent, TileComponent],
})
class TilesHostComponent {
  readonly third = signal(false);
}

describe('TileGroupComponent', () => {
  let component: TileGroupComponent;
  let fixture: ComponentFixture<TileGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ TileGroupComponent ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TileGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the column class from the number of tiles, and follows a tile added later', async () => {
    const host = TestBed.createComponent(TilesHostComponent);
    await host.whenStable();
    const group = (host.nativeElement as HTMLElement).querySelector('app-tile-group')!;
    expect(group.classList.contains('tile-group-2-cols')).toBe(true);

    host.componentInstance.third.set(true);
    await host.whenStable();
    expect(group.classList.contains('tile-group-3-cols')).toBe(true);
    expect(group.classList.contains('tile-group-2-cols')).toBe(false);
  });
});
