import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MDAppModule } from '../../../core/md.module';

import { TileSelectorComponent } from './tile-selector.component';
import { TileSelectorTileComponent } from './../tile-selector-tile/tile-selector-tile.component';

describe('TileSelectorComponent', () => {
  let component: TileSelectorComponent;
  let fixture: ComponentFixture<TileSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule
      ],
      declarations: [TileSelectorComponent, TileSelectorTileComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
