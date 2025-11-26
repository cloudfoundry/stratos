import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoContentMessageComponent } from './no-content-message.component';

describe('NoContentMessageComponent', () => {
  let component: NoContentMessageComponent;
  let fixture: ComponentFixture<NoContentMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        NoContentMessageComponent,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoContentMessageComponent);
    component = fixture.componentInstance;
    component.secondLine = {
      link: '',
      linkText: '',
      text: '',
    };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
