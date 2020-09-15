import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorTileComponent } from './tile-selector-tile.component';
import { ITileImgConfig } from '../tile/tile-selector.types';
import { MDAppModule } from '../../../core/md.module';

describe('TileSelectorTileComponent', () => {
  let component: TileSelectorTileComponent<ITileImgConfig>;
  let fixture: ComponentFixture<TileSelectorTileComponent<ITileImgConfig>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule
      ],
      declarations: [ TileSelectorTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileSelectorTileComponent) as ComponentFixture<TileSelectorTileComponent<ITileImgConfig>>;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
