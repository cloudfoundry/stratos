import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorTileComponent } from './tile-selector-tile.component';

describe('TileSelectorTileComponent', () => {
  let component: TileSelectorTileComponent;
  let fixture: ComponentFixture<TileSelectorTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TileSelectorTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileSelectorTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
