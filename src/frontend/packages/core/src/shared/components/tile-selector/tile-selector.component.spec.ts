import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { MDAppModule } from '../../../core/md.module';

import { ITileConfig } from '../tile/tile-selector.types';
import { TileSelectorComponent } from './tile-selector.component';

describe('TileSelectorComponent', () => {
  let component: TileSelectorComponent;
  let fixture: ComponentFixture<TileSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        TileSelectorComponent, // Now standalone (includes TileSelectorTileComponent),
        MDAppModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(TileSelectorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const tile = (label: string, hidden = false) => new ITileConfig(label, { matIcon: 'apps' }, undefined, hidden);
  const labels = () => Array.from(fixture.nativeElement.querySelectorAll('h3')).map((h3: any) => h3.textContent);
  const smaller = () => fixture.nativeElement.querySelectorAll('.tile-selector-parent.smaller').length;

  it('keeps hidden tiles behind "Show more"', async () => {
    fixture.componentRef.setInput('options', [tile('One'), tile('Two', true)]);
    await fixture.whenStable();
    expect(labels()).toEqual(['One']);

    fixture.nativeElement.querySelector('.tile-selector__more').click();
    await fixture.whenStable();
    expect(labels()).toEqual(['One', 'Two']);
  });

  it('uses smaller tiles once more than dynamicSmallerTiles are shown', async () => {
    fixture.componentRef.setInput('dynamicSmallerTiles', 2);
    fixture.componentRef.setInput('options', [tile('One'), tile('Two'), tile('Hidden', true)]);
    await fixture.whenStable();
    expect(smaller()).toBe(0);

    fixture.componentRef.setInput('options', [tile('One'), tile('Two'), tile('Three')]);
    await fixture.whenStable();
    expect(smaller()).toBe(3);
  });
});
