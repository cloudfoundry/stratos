import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { MDAppModule } from '../../../core/md.module';
import { SidePanelService } from './../../services/side-panel.service';
import { SidepanelPreviewComponent } from './sidepanel-preview.component';

describe('SidepanelPreviewComponent', () => {
  let component: SidepanelPreviewComponent;
  let fixture: ComponentFixture<SidepanelPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpClient, HttpHandler, SidePanelService],
      imports: [
        SidepanelPreviewComponent,
        MDAppModule,
        RouterTestingModule,
        HttpClientModule,
        HttpClientTestingModule,
        CoreTestingModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidepanelPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
