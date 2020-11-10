import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesSidePanelComponent } from './favorites-side-panel.component';

describe('FavoritesSidePanelComponent', () => {
  let component: FavoritesSidePanelComponent;
  let fixture: ComponentFixture<FavoritesSidePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FavoritesSidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
