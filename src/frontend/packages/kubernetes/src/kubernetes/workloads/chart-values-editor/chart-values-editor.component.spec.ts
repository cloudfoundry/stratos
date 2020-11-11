import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { MDAppModule } from '../../../../../core/src/public-api';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { ChartValuesEditorComponent } from './chart-values-editor.component';

describe('ChartValuesEditorComponent', () => {
  let component: ChartValuesEditorComponent;
  let fixture: ComponentFixture<ChartValuesEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChartValuesEditorComponent],
      providers: [
        HttpClient,
        HttpHandler,
        ConfirmationDialogService,
      ],
      imports: [
        MDAppModule,
        HttpClientModule,
        HttpClientTestingModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartValuesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
