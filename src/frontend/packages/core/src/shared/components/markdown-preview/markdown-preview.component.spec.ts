import { SidePanelService } from './../../services/side-panel.service';
import { MDAppModule } from './../../../core/md.module';
import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { createBasicStoreModule } from '@stratos/store/testing';
import { LoggerService } from '../../../core/logger.service';
import { SidepanelPreviewComponent } from '../sidepanel-preview/sidepanel-preview.component';
import { MarkdownPreviewComponent } from './markdown-preview.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('MarkdownPreviewComponent', () => {
  let component: MarkdownPreviewComponent;
  let fixture: ComponentFixture<MarkdownPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MarkdownPreviewComponent, SidepanelPreviewComponent],
      providers: [LoggerService, HttpClient, HttpHandler, SidePanelService],
      imports: [
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
    fixture = TestBed.createComponent(MarkdownPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
