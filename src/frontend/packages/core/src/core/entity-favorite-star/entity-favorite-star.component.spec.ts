import { OverlayContainer } from '@angular/cdk/overlay';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

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
  let overlayContainerElement: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfirmationDialogService,
        PaginationMonitorFactory,
        {
          provide: OverlayContainer, useFactory: () => {
            overlayContainerElement = document.createElement('div');
            return { getContainerElement: () => overlayContainerElement };
          }
        },
        SessionService
      ],
      declarations: [
        DialogConfirmComponent
      ],
      imports: [
        ...BaseTestModulesNoShared
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityFavoriteStarComponent);
    userFavoriteManager = TestBed.get(UserFavoriteManager);
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
    spyOn(userFavoriteManager, 'getIsFavoriteObservable').and.returnValue(of(true));
    component.favorite = favorite;
    fixture.detectChanges();

    expect(element.textContent).toContain('star');
  });

  it('should set isFavorite based on favorite [2]', () => {
    spyOn(userFavoriteManager, 'getIsFavoriteObservable').and.returnValue(of(false));
    component.favorite = favorite;
    fixture.detectChanges();

    expect(element.textContent).toContain('star_border');
  });

  it('should toggle favorite if clicked', () => {
    const isFavorite$ = new BehaviorSubject<boolean>(false);
    spyOn(userFavoriteManager, 'toggleFavorite').and.callFake(() => isFavorite$.next(!isFavorite$.getValue()));
    spyOn(userFavoriteManager, 'getIsFavoriteObservable').and.returnValue(isFavorite$);
    component.favorite = favorite;
    fixture.detectChanges();

    const starEl: HTMLElement = element.querySelector('.favorite-star');
    starEl.click();
    expect(element.textContent).toContain('star');

    starEl.click();
    expect(element.textContent).toContain('star_border');
  });

  xit('should toggle even through confirmation dialog if confirm removal', () => {
    spyOn(userFavoriteManager, 'toggleFavorite');
    spyOn(userFavoriteManager, 'getIsFavoriteObservable').and.returnValue(of(true));
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
