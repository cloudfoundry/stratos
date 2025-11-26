import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { MDAppModule } from '../../../../../core/src/public-api';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { ChartValuesEditorComponent } from './chart-values-editor.component';

describe('ChartValuesEditorComponent', () => {
  let component: ChartValuesEditorComponent;
  let fixture: ComponentFixture<ChartValuesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({providers: [

        HttpClient,
        HttpHandler,
        ConfirmationDialogService,

      provideZonelessChangeDetection(),
    ],
      imports: [
        MDAppModule,
        HttpClientModule,
        HttpClientTestingModule,
        createBasicStoreModule(),

        ChartValuesEditorComponent,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartValuesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
