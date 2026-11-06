import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TokenEndpointComponent } from './token-endpoint.component';

describe('TokenEndpointComponent', () => {
  let component: TokenEndpointComponent;
  let fixture: ComponentFixture<TokenEndpointComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        TokenEndpointComponent,
        ReactiveFormsModule,
      ],

    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenEndpointComponent);
    component = fixture.componentInstance;

    // Provide FormGroup instance for component with correct structure.
    // strict: the template binds [formGroup]="formGroup" then formGroupName="authValues"
    // / formControlName="token", so the runtime shape is { authValues: { token } }. The
    // component's declared FormGroup<TokenAuthForm> ({ token }) understates that nesting;
    // the cast keeps the mock faithful to the template the test renders.
    component.formGroup = new FormGroup({
      authValues: new FormGroup({
        token: new FormControl('', { nonNullable: true }),
      }),
    }) as unknown as typeof component.formGroup;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
