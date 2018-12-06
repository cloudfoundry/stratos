import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesEntityListComponent } from './favorites-entity-list.component';

describe('FavoritesEntityListComponent', () => {
  let component: FavoritesEntityListComponent;
  let fixture: ComponentFixture<FavoritesEntityListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FavoritesEntityListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesEntityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
