import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TileSelectorTileComponent } from './tile-selector-tile.component';
import { MDAppModule } from '../../../core/md.module';
import { ITileConfig } from '../tile/tile-selector.types';

describe('TileSelectorTileComponent', () => {
  let component: TileSelectorTileComponent;
  let fixture: ComponentFixture<TileSelectorTileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      providers: [provideZonelessChangeDetection()],
      
      imports: [
        MDAppModule,
        TileSelectorTileComponent,
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TileSelectorTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // A font icon (the Autoscaler tile, Backup/Restore) rendered at the icon's
  // default 24px beside 80px logos: the tile's icon size never reached the
  // glyph. Pages that opt in get an inline icon sized by the tile; others
  // (setup, Add Service Instance) keep the 24px glyph.
  it('sizes a font icon from the tile only when asked', async () => {
    const glyph = () => fixture.nativeElement.querySelector('.tile-selector__icon i') as HTMLElement;
    fixture.componentRef.setInput('tile',
      new ITileConfig('Cloud Foundry Autoscaler', { matIcon: 'meter', matIconFont: 'stratos-icons' }));
    await fixture.whenStable();
    expect(glyph().classList).not.toContain('inline');

    fixture.componentRef.setInput('scaleIcon', true);
    await fixture.whenStable();
    expect(glyph().classList).toContain('inline');
    expect(glyph().classList).toContain('stratos-icons');
  });
});
