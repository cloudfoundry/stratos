import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TileSelectorTileComponent } from './tile-selector-tile.component';
import { ITileImgConfig } from '../tile/tile-selector.types';
import { MDAppModule } from '../../../core/md.module';

describe('TileSelectorTileComponent', () => {
  let component: TileSelectorTileComponent<ITileImgConfig>;
  let fixture: ComponentFixture<TileSelectorTileComponent<ITileImgConfig>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      providers: [provideZonelessChangeDetection()],
      
      imports: [
        MDAppModule,
        TileSelectorTileComponent
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TileSelectorTileComponent) as ComponentFixture<TileSelectorTileComponent<ITileImgConfig>>;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
