import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '@stratosui/core';
import { MDAppModule } from '@stratosui/core';
import { CodeBlockComponent } from '@stratosui/core';
import {
  CopyToClipboardComponent,
} from '@stratosui/core';
import { CliInfoComponent } from './cli-info.component';

describe('CliInfoComponent', () => {
  let component: CliInfoComponent;
  let fixture: ComponentFixture<CliInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CoreModule,
        MDAppModule,
        CliInfoComponent,
        CodeBlockComponent,
        CopyToClipboardComponent,
    ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
