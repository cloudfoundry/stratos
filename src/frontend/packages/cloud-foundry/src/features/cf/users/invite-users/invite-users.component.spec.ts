import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import {
  generateCfActiveRouteMock,
  generateCfBaseTestModules,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { InviteUsersCreateComponent } from './invite-users-create/invite-users-create.component';
import { InviteUsersComponent } from "./invite-users.component";
describe('InviteUsersComponent', () => {
  let component: InviteUsersComponent;
  let fixture: ComponentFixture<InviteUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        InviteUsersComponent,
        InviteUsersCreateComponent,
        ...generateCfBaseTestModules(),
      ],
      providers: [
        
        generateCfActiveRouteMock(),
        HttpClient,
        HttpHandler,
        TabNavService,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
