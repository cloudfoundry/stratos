import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { RoleTristateCheckboxComponent } from './role-tristate-checkbox.component';

describe('RoleTristateCheckboxComponent', () => {
  let fixture: ComponentFixture<RoleTristateCheckboxComponent>;
  let component: RoleTristateCheckboxComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleTristateCheckboxComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleTristateCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders indeterminate when checked is null', async () => {
    fixture.componentRef.setInput('checked', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const checkbox = fixture.debugElement.query(By.css('app-checkbox'));
    expect(checkbox).toBeTruthy();
    expect(checkbox.componentInstance.indeterminate).toBe(true);
  });

  it('emits true when an unchecked box is clicked', async () => {
    component.checked = false;
    fixture.detectChanges();
    await fixture.whenStable();

    const emitted: boolean[] = [];
    component.toggled.subscribe((v: boolean) => emitted.push(v));

    const checkbox = fixture.debugElement.query(By.css('app-checkbox'));
    checkbox.componentInstance.change.emit({ checked: true, source: checkbox.componentInstance });

    expect(emitted).toEqual([true]);
  });

  it('emits false when a checked box is clicked', async () => {
    component.checked = true;
    fixture.detectChanges();
    await fixture.whenStable();

    const emitted: boolean[] = [];
    component.toggled.subscribe((v: boolean) => emitted.push(v));

    const checkbox = fixture.debugElement.query(By.css('app-checkbox'));
    checkbox.componentInstance.change.emit({ checked: false, source: checkbox.componentInstance });

    expect(emitted).toEqual([false]);
  });

  it('does not emit when disabled', () => {
    component.checked = false;
    component.disabled = true;
    fixture.detectChanges();

    const emitted: boolean[] = [];
    component.toggled.subscribe((v: boolean) => emitted.push(v));

    // Call onChange directly (the way the template calls it when (change) fires)
    component.onChange(true);

    expect(emitted).toEqual([]);
  });
});
