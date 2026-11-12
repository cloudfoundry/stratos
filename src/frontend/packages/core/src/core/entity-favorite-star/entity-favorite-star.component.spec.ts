import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORE_TEST_PROVIDERS, BaseTestModulesNoShared } from '@test-framework/core-test.helper';
import { IFavoriteMetadata, UserFavorite, UserFavoriteManager } from '@stratosui/store';
import { ConfirmationDialogService } from '../../shared/components/confirmation-dialog.service';
import { DialogConfirmComponent } from '../../shared/components/dialog-confirm/dialog-confirm.component';
import { SessionService } from '../../shared/services/session.service';
import { EndpointsService } from '../endpoints.service';
import { EntityFavoriteStarComponent } from './entity-favorite-star.component';

describe('EntityFavoriteStarComponent', () => {
  let component: EntityFavoriteStarComponent;
  let fixture: ComponentFixture<EntityFavoriteStarComponent>;
  let element: HTMLElement;
  let userFavoriteManager: UserFavoriteManager;
  let favorite: UserFavorite;
  const disablePersistenceFeatures = signal(false);
  beforeEach(() => {
    disablePersistenceFeatures.set(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: EndpointsService, useValue: { disablePersistenceFeatures } },
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
    // Not a favorite unless a test says otherwise. Nothing renders here, so
    // each test can still replace the lookup before the first render.
    vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(false);
    fixture.componentRef.setInput('favorite', favorite);
  });

  it('should create', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should show unfilled star icon if not favorited', async () => {
    vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(false);
    await fixture.whenStable();

    expect(element.textContent).toContain('star_border');
  });

  it('should show filled star icon if favorited', async () => {
    vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(true);
    await fixture.whenStable();

    expect(element.textContent).toContain('star');
  });

  // Named by what it does, as the list view's star is; the icon's name
  // ("star_border") is hidden from screen readers.
  it.each([[false, 'Add to favorites'], [true, 'Remove from favorites']])(
    'names the button by its action (favorite: %s)', async (isFavorite, name) => {
      vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(isFavorite);
      await fixture.whenStable();

      const button = element.querySelector('[role="button"]') as HTMLElement;
      expect(button.getAttribute('aria-label')).toBe(name);
      expect(button.querySelector('app-custom-icon')?.getAttribute('aria-hidden')).toBe('true');
    });

  it('should set isFavorite based on favorite', async () => {
    vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(true);
    await fixture.whenStable();

    expect(element.textContent).toContain('star');
  });

  it('should set isFavorite based on favorite [2]', async () => {
    vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(false);
    await fixture.whenStable();

    expect(element.textContent).toContain('star_border');
  });

  it('should toggle favorite if clicked', async () => {
    const isFav = signal(false);
    vi.spyOn(userFavoriteManager, 'toggleFavorite').mockImplementation(() => isFav.update(v => !v));
    vi.spyOn(userFavoriteManager, 'isFavorite').mockImplementation(() => isFav());
    await fixture.whenStable();

    // strict: the star control renders for a favorited entity after whenStable
    const starEl: HTMLElement = element.querySelector('[role="button"]')!;
    starEl.click();
    await fixture.whenStable();
    expect(element.textContent).toContain('star');

    starEl.click();
    await fixture.whenStable();
    expect(element.textContent).toContain('star_border');
  });

  it('should toggle even through confirmation dialog if confirm removal', async () => {
    // Use fake timers for controlling dialog animations
    vi.useFakeTimers();

    try {
      // Set up the test scenario
      const isFav = signal(true);
      const toggleSpy = vi.spyOn(userFavoriteManager, 'toggleFavorite').mockImplementation(() => {
        isFav.update(v => !v);
      });
      vi.spyOn(userFavoriteManager, 'isFavorite').mockImplementation(() => isFav());

      fixture.componentRef.setInput('confirmRemoval', true);
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();

      // Verify initial state - should show filled star
      expect(element.textContent).toContain('star');

      // Click the star to trigger confirmation dialog
      // strict: the star control renders for a favorited entity after the first render
      const starEl: HTMLElement = element.querySelector('[role="button"]')!;
      starEl.click();
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();
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
      await vi.advanceTimersByTimeAsync(0);
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
      vi.spyOn(userFavoriteManager, 'isFavorite').mockReturnValue(true);

      fixture.componentRef.setInput('confirmRemoval', true);
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();

      // Click the star
      // strict: the star control renders for a favorited entity after the first render
      const starEl: HTMLElement = element.querySelector('[role="button"]')!;
      starEl.click();
      await vi.advanceTimersByTimeAsync(0);
      await fixture.whenStable();
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
    disablePersistenceFeatures.set(true);
    await fixture.whenStable();

    expect(element.textContent).toBe('');
  });
});
