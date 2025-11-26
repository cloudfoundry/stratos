import { HttpClientTestingModule } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ApplicationServiceMock, generateCfStoreModules } from '@test-framework/cf';
import { ApplicationService } from '../../application.service';
import { AddRoutesComponent } from "./add-routes.component";

describe('AddRoutesComponent', () => {
  let component: AddRoutesComponent;
  let fixture: ComponentFixture<AddRoutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AddRoutesComponent,
        ...generateCfStoreModules(),
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
