import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { EulaPageComponent } from './eula-page.component';

describe('EulaPageComponent', () => {
  let component: EulaPageComponent;
  let fixture: ComponentFixture<EulaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        createBasicStoreModule(),
        EulaPageComponent,
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EulaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression: the EULA arrives from an HTTP response after the first render.
  // Under zoneless change detection an OnPush view only repaints for signal
  // writes, so a plain field assigned in the subscribe left the page blank.
  it('renders the EULA once the fetch resolves', async () => {
    TestBed.inject(HttpTestingController)
      .expectOne('/core/assets/eula.html')
      .flush('<p class="eula-body">Licence text</p>');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.eula-body')?.textContent).toBe('Licence text');
  });
});
