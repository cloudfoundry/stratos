import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
import { IFavoriteMetadata, UserFavorite } from '../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../store/src/user-favorite-manager';
import { BaseTestModulesNoShared } from '../../../test-framework/core-test.helper';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { DialogConfirmComponent } from '../../shared/components/dialog-confirm/dialog-confirm.component';
import { SessionService } from '../../shared/services/session.service';
import { EntityFavoriteStarComponent } from './entity-favorite-star.component';

describe('EntityFavoriteStarComponent', () => {
  let component: EntityFavoriteStarComponent;
  let fixture: ComponentFixture<EntityFavoriteStarComponent>;
  let element: HTMLElement;
  let userFavoriteManager: UserFavoriteManager;
  let favorite: UserFavorite;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        ...STORE_TEST_PROVIDERS,
        ConfirmationDialogService,
        SessionService
      ],
      imports: [
        ...BaseTestModulesNoShared,
        EntityFavoriteStarComponent,
        DialogConfirmComponent
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityFavoriteStarComponent);
    userFavoriteManager = TestBed.inject(UserFavoriteManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
    favorite = new UserFavorite<IFavoriteMetadata>('endpoint', 'endpointType', 'entityType');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show unfilled star icon if not favorited', () => {
    component.isFavorite$ = of(false);
    fixture.detectChanges();

    expect(element.textContent).toContain('star_border');
  });

  it('should show filled star icon if favorited', () => {
    component.isFavorite$ = of(true);
    fixture.detectChanges();

    expect(element.textContent).toContain('star');
  });

  it('should set isFavorite based on favorite', () => {
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(of(true));
    component.favorite = favorite;
    fixture.detectChanges();

    expect(element.textContent).toContain('star');
  });

  it('should set isFavorite based on favorite [2]', () => {
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(of(false));
    component.favorite = favorite;
    fixture.detectChanges();

    expect(element.textContent).toContain('star_border');
  });

  it('should toggle favorite if clicked', () => {
    const isFavorite$ = new BehaviorSubject<boolean>(false);
    vi.spyOn(userFavoriteManager, 'toggleFavorite').mockImplementation(() => isFavorite$.next(!isFavorite$.getValue()));
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(isFavorite$);
    component.favorite = favorite;
    fixture.detectChanges();

    const starEl: HTMLElement = element.querySelector('.favorite-star');
    starEl.click();
    expect(element.textContent).toContain('star');

    starEl.click();
    expect(element.textContent).toContain('star_border');
  });

  xit('should toggle even through confirmation dialog if confirm removal', () => {
    vi.spyOn(userFavoriteManager, 'toggleFavorite');
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(of(true));
    component.confirmRemoval = true;
    component.favorite = favorite;
    fixture.detectChanges();

    const starEl: HTMLElement = element.querySelector('.favorite-star');
    starEl.click();
    expect(element.textContent).toContain('star');
    // expect overlayContainerElement and click 'yes' and check below

    starEl.click();
    expect(element.textContent).toContain('star');
  });

  it('should hide if persistence not available', () => {
    component.endpointsService.disablePersistenceFeatures$ = of(true);
    fixture.detectChanges();

    expect(element.textContent).toBe('');
  });
});
