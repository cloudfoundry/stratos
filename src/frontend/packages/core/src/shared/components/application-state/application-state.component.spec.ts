import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MDAppModule } from '../../../core/md.module';
import { ApplicationStateIconComponent } from './application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from './application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './application-state.component';

describe('ApplicationStateComponent', () => {
  let component: ApplicationStateComponent;
  let fixture: ComponentFixture<ApplicationStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      declarations: [
        ApplicationStateIconPipe
      ],
      imports: [
        MDAppModule,
        ApplicationStateComponent,
        ApplicationStateIconComponent
      ]
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
