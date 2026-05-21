import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { STORE_TEST_PROVIDERS, BaseTestModulesNoShared } from '@test-framework/core-test.helper';
import { IFavoriteMetadata, UserFavorite, UserFavoriteManager } from '@stratosui/store';
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
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        ConfirmationDialogService,
        SessionService,
        provideZonelessChangeDetection(),
      ],
      imports: [
        ...BaseTestModulesNoShared,
        EntityFavoriteStarComponent,
        DialogConfirmComponent,
      ],
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityFavoriteStarComponent);
    userFavoriteManager = TestBed.inject(UserFavoriteManager);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    favorite = new UserFavorite<IFavoriteMetadata>('endpoint', 'endpointType', 'entityType');
    // Initialize disablePersistenceFeatures$ to false so the component renders
    component.endpointsService.disablePersistenceFeatures$ = of(false);
    // Don't call detectChanges here - let each test control when that happens
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show unfilled star icon if not favorited', async () => {
    component.isFavorite$ = of(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.textContent).toContain('star_border');
  });

  it('should show filled star icon if favorited', async () => {
    component.isFavorite$ = of(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.textContent).toContain('star');
  });

  it('should set isFavorite based on favorite', async () => {
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(of(true));
    component.favorite = favorite;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.textContent).toContain('star');
  });

  it('should set isFavorite based on favorite [2]', async () => {
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(of(false));
    component.favorite = favorite;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.textContent).toContain('star_border');
  });

  it('should toggle favorite if clicked', async () => {
    const isFavorite$ = new BehaviorSubject<boolean>(false);
    vi.spyOn(userFavoriteManager, 'toggleFavorite').mockImplementation(() => isFavorite$.next(!isFavorite$.getValue()));
    vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(isFavorite$);
    component.favorite = favorite;
    fixture.detectChanges();
    await fixture.whenStable();

    const starEl: HTMLElement = element.querySelector('[role="button"]');
    starEl.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.textContent).toContain('star');

    starEl.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.textContent).toContain('star_border');
  });

  it('should toggle even through confirmation dialog if confirm removal', async () => {
    // Use fake timers for controlling dialog animations
    vi.useFakeTimers();

    try {
      // Set up the test scenario
      const isFavorite$ = new BehaviorSubject<boolean>(true);
      const toggleSpy = vi.spyOn(userFavoriteManager, 'toggleFavorite').mockImplementation(() => {
        isFavorite$.next(!isFavorite$.getValue());
      });
      vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(isFavorite$);

      component.confirmRemoval = true;
      component.favorite = favorite;
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      // Verify initial state - should show filled star
      expect(element.textContent).toContain('star');

      // Click the star to trigger confirmation dialog
      const starEl: HTMLElement = element.querySelector('[role="button"]');
      starEl.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      await vi.runAllTimersAsync(); // Wait for dialog animations

      // Verify dialog opened in document.body (not in component element)
      const dialogBackdrop = document.querySelector('.fixed.inset-0');
      expect(dialogBackdrop).toBeTruthy();

      // Verify toggleFavorite NOT called yet
      expect(toggleSpy).not.toHaveBeenCalled();

      // Find and click the "Yes" button in the confirmation dialog
      const buttons = document.querySelectorAll('button');
      const confirmButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'Yes');
      expect(confirmButton).toBeTruthy();

      confirmButton!.click();
      await vi.advanceTimersByTimeAsync(300); // Wait for dialog close animation
      await vi.runAllTimersAsync();

      // Now toggleFavorite should have been called
      expect(toggleSpy).toHaveBeenCalledTimes(1);
      expect(toggleSpy).toHaveBeenCalledWith(favorite);

      // Wait for observable to update
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify star is now unfilled
      expect(element.textContent).toContain('star_border');
    } finally {
      // Cleanup - always restore real timers
      vi.useRealTimers();
    }
  });

  it('should NOT toggle when confirmation dialog is cancelled', async () => {
    // Use fake timers for controlling dialog animations
    vi.useFakeTimers();

    try {
      const toggleSpy = vi.spyOn(userFavoriteManager, 'toggleFavorite');
      vi.spyOn(userFavoriteManager, 'getIsFavoriteObservable').mockReturnValue(of(true));

      component.confirmRemoval = true;
      component.favorite = favorite;
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      // Click the star
      const starEl: HTMLElement = element.querySelector('[role="button"]');
      starEl.click();
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);
      await vi.runAllTimersAsync();

      // Find and click the "Cancel" button
      const buttons = document.querySelectorAll('button');
      const cancelButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'Cancel');
      expect(cancelButton).toBeTruthy();

      cancelButton!.click();
      await vi.advanceTimersByTimeAsync(300);
      await vi.runAllTimersAsync();

      // Verify toggleFavorite was NOT called
      expect(toggleSpy).not.toHaveBeenCalled();

      // Verify star is still filled
      expect(element.textContent).toContain('star');
    } finally {
      // Cleanup - always restore real timers
      vi.useRealTimers();
    }
  });

  it('should hide if persistence not available', async () => {
    component.endpointsService.disablePersistenceFeatures$ = of(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(element.textContent).toBe('');
  });
});
