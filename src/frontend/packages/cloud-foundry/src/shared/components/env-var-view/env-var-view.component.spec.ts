import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { MAT_DIALOG_DATA } from '@stratosui/core';
import { EnvVarViewComponent } from './env-var-view.component';

describe('EnvVarViewComponent', () => {
  let component: EnvVarViewComponent;
  let fixture: ComponentFixture<EnvVarViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvVarViewComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: 'TailwindDialogRef', useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { key: 'TEST_KEY', value: 'test value' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnvVarViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have data from MAT_DIALOG_DATA', () => {
    expect(component.data.key).toBe('TEST_KEY');
    expect(component.data.value).toBe('test value');
  });

  it('should detect objects correctly', () => {
    expect(component.isObject({})).toBe(true);
    expect(component.isObject('string')).toBe(false);
    expect(component.isObject(123)).toBe(false);
  });
});
