import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/core-test.helper";
import { BooleanIndicatorComponent } from '../boolean-indicator/boolean-indicator.component';
import { StackedInputActionComponent, StackedInputActionResult } from './stacked-input-action/stacked-input-action.component';
import { StackedInputActionsComponent, StackedInputActionsState } from './stacked-input-actions.component';

describe('StackedInputActionsComponent', () => {
  let component: StackedInputActionsComponent;
  let fixture: ComponentFixture<StackedInputActionsComponent>;
  let stateIn: BehaviorSubject<StackedInputActionsState[]>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection()
      ],
      imports: [
        ...BaseTestModulesNoShared,
        StackedInputActionsComponent,
        BooleanIndicatorComponent,
        StackedInputActionComponent,
      ],
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedInputActionsComponent);
    component = fixture.componentInstance;
    stateIn = new BehaviorSubject<StackedInputActionsState[]>([]);
    component.stateIn$ = stateIn;
    fixture.detectChanges();
  });

  const host = (): HTMLElement => fixture.nativeElement;
  const addButton = () => host().querySelector<HTMLButtonElement>('button.stacked-input__add')!;
  const resultIcon = () => host().querySelector('app-stacked-input-action app-boolean-indicator .material-icons');
  const pushState = async (result: StackedInputActionResult, message?: string) => {
    stateIn.next([{ key: '0', result, message }]);
    await fixture.whenStable();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables "Add another" while a row is processing', async () => {
    await fixture.whenStable();
    expect(addButton().disabled).toBe(false);

    await pushState(StackedInputActionResult.PROCESSING);

    expect(addButton().disabled).toBe(true);
  });

  it('shows the succeeded result after processing', async () => {
    await pushState(StackedInputActionResult.PROCESSING);
    expect(resultIcon()).toBeNull();

    await pushState(StackedInputActionResult.SUCCEEDED, 'Invited');

    expect(resultIcon()?.textContent?.trim()).toBe('check_circle');
    expect(host().querySelector('app-stacked-input-action')?.textContent).toContain('Invited');
    expect(addButton().disabled).toBe(false);
  });

  it('shows the failed result after processing', async () => {
    await pushState(StackedInputActionResult.PROCESSING);

    await pushState(StackedInputActionResult.FAILED, 'Could not invite');

    expect(resultIcon()?.textContent?.trim()).toBe('remove_circle');
    expect(host().querySelector('app-stacked-input-action')?.textContent).toContain('Could not invite');
  });

  it('emits each row value under its own key', async () => {
    const emitted: { values: Record<string, string> }[] = [];
    component.stateOut.subscribe(update => emitted.push(update));
    addButton().click();
    await fixture.whenStable();

    const inputs = host().querySelectorAll<HTMLInputElement>('input[data-test="stacked-input"]');
    expect(inputs.length).toBe(2);
    inputs[0].value = 'a@example.com';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'b@example.com';
    inputs[1].dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(emitted.at(-1)?.values).toEqual({ 0: 'a@example.com', 1: 'b@example.com' });
  });
});
