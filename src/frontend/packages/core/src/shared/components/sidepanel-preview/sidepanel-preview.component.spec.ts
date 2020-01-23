import { SidePanelService } from './../../services/side-panel.service';
import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { LoggerService } from '../../../core/logger.service';
import { SidepanelPreviewComponent } from './sidepanel-preview.component';
import { createBasicStoreModule } from '@stratos/store/testing';
import { MDAppModule } from '../../../core/md.module';
import { RouterTestingModule } from '@angular/router/testing';

describe('SidepanelPreviewComponent', () => {
  let component: SidepanelPreviewComponent;
  let fixture: ComponentFixture<SidepanelPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SidepanelPreviewComponent],
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
    fixture = TestBed.createComponent(SidepanelPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
