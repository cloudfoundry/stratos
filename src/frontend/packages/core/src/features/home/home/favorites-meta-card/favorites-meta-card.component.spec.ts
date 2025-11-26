import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { SessionService } from '../../../../shared/services/session.service';
import { FavoritesMetaCardComponent } from './favorites-meta-card.component';

describe('FavoritesMetaCardComponent', () => {
  let component: FavoritesMetaCardComponent;
  let fixture: ComponentFixture<FavoritesMetaCardComponent>;

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
        FavoritesMetaCardComponent,
      ],
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FavoritesMetaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
