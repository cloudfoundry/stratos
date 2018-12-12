import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityFavoriteStarComponent } from './entity-favorite-star.component';
import { BaseTestModulesNoShared } from '../../test-framework/cloud-foundry-endpoint-service.helper';

describe('EntityFavoriteStarComponent', () => {
  let component: EntityFavoriteStarComponent;
  let fixture: ComponentFixture<EntityFavoriteStarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
      ],
      imports: [...BaseTestModulesNoShared],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityFavoriteStarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
