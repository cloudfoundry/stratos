import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModulesNoShared } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { EntityFavoriteStarComponent } from './entity-favorite-star.component';

describe('EntityFavoriteStarComponent', () => {
  let component: EntityFavoriteStarComponent;
  let fixture: ComponentFixture<EntityFavoriteStarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        PaginationMonitorFactory
      ],
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
