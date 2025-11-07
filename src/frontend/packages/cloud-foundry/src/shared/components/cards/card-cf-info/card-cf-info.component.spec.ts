import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import {
  CopyToClipboardComponent,
} from '../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import {
  generateCfBaseTestModulesNoShared,
  generateTestCfEndpointService,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { UserInviteService } from '../../../../features/cf/user-invites/user-invite.service';
import { CardCfInfoComponent } from "./card-cf-info.component";
describe('CardCfInfoComponent', () => {
  let component: CardCfInfoComponent;
  let fixture: ComponentFixture<CardCfInfoComponent>;
  beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          ...generateCfBaseTestModulesNoShared(),
          CardCfInfoComponent,
          MetadataItemComponent,
          BooleanIndicatorComponent,
          CopyToClipboardComponent,
    ],
        providers: [
          
          generateTestCfEndpointService(),
          UserInviteService,
          ConfirmationDialogService,

          provideZonelessChangeDetection(),
        ]
      }).compileComponents();
    });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
