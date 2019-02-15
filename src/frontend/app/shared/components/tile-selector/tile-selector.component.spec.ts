import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorComponent } from './tile-selector.component';

describe('TileSelectorComponent', () => {
  let component: TileSelectorComponent;
  let fixture: ComponentFixture<TileSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TileSelectorComponent ]
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
