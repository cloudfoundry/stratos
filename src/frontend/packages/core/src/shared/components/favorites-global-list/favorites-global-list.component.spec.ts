import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesGlobalListComponent } from './favorites-global-list.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

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
