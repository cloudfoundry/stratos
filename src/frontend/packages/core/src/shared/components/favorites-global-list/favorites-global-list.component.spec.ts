import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { FavoritesGlobalListComponent } from './favorites-global-list.component';

describe('FavoritesGlobalListComponent', () => {
  let component: FavoritesGlobalListComponent;
  let fixture: ComponentFixture<FavoritesGlobalListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModules],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesGlobalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
