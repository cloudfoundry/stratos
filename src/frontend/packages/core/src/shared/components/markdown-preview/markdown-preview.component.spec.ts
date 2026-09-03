import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { SidepanelPreviewComponent } from '../sidepanel-preview/sidepanel-preview.component';
import { MDAppModule } from './../../../core/md.module';
import { SidePanelService } from './../../services/side-panel.service';
import { MarkdownPreviewComponent } from './markdown-preview.component';

describe('MarkdownPreviewComponent', () => {
  let component: MarkdownPreviewComponent;
  let fixture: ComponentFixture<MarkdownPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SidePanelService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        MarkdownPreviewComponent,
        SidepanelPreviewComponent,
        MDAppModule,
        RouterTestingModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression: the document arrives from an HTTP response after the first
  // render. Under zoneless change detection an OnPush view only repaints for
  // signal writes, so a plain field assigned in the subscribe left the help
  // panel empty.
  it('renders the fetched markdown', async () => {
    component.setProps({ documentUrl: '/help.md' });
    TestBed.inject(HttpTestingController).expectOne('/help.md').flush('Some **help** text');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.markdown-preview__content')?.textContent).toContain('Some help text');
  });
});
