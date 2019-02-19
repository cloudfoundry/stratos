import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesEntityListComponent } from './favorites-entity-list.component';
import { BaseTestModulesNoShared } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SharedModule } from '../../shared.module';

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
