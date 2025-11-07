import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { CoreTestingModule } from '../../../../../core/test-framework/core-test.modules';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { GitTestingModule } from '../../../git-testing.module';
import { GitEndpointDetailsComponent } from './git-endpoint-details.component';

describe('GitEndpointDetailsComponent', () => {
  let component: GitEndpointDetailsComponent;
  let fixture: ComponentFixture<GitEndpointDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        CoreModule,
        CoreTestingModule,
        SharedModule,
        GitTestingModule,
        GitEndpointDetailsComponent,
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GitEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
