import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapRoutesComponent } from './map-routes.component';

describe('MapRoutesComponent', () => {
  let component: MapRoutesComponent;
  let fixture: ComponentFixture<MapRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
