import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { SharedModule } from '../../shared.module';
import { FavoritesEntityListComponent } from './favorites-entity-list.component';

describe('FavoritesEntityListComponent', () => {
  let component: FavoritesEntityListComponent;
  let fixture: ComponentFixture<FavoritesEntityListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule
      ],
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
