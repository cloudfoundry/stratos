import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesMetaCardComponent } from './favorites-meta-card.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('FavoritesMetaCardComponent', () => {
  let component: FavoritesMetaCardComponent;
  let fixture: ComponentFixture<FavoritesMetaCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...BaseTestModules],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesMetaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
