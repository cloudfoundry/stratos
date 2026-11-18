import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MAT_DIALOG_DATA, TailwindSnackBarService } from '@stratosui/core';

import { UserInviteConfigureService } from '../user-invite.service';
import { UserInviteConfigurationDialogComponent } from './user-invite-configuration-dialog.component';

describe('UserInviteConfigurationDialogComponent', () => {
  let fixture: ComponentFixture<UserInviteConfigurationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInviteConfigurationDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: 'TailwindDialogRef', useValue: { close: () => {} } },
        { provide: TailwindSnackBarService, useValue: { error: () => {} } },
        { provide: UserInviteConfigureService, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { guid: 'cf-guid' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserInviteConfigurationDialogComponent);
    await fixture.whenStable();
  });

  it('names the Client ID and Client Secret fields with a visible label', () => {
    const root: HTMLElement = fixture.nativeElement;
    for (const [control, text] of [['clientID', 'Client ID'], ['clientSecret', 'Client Secret']]) {
      const input = root.querySelector<HTMLInputElement>(`input[formControlName="${control}"]`);
      expect(input?.id, `${control} has an id`).toBeTruthy();
      const label = root.querySelector(`label[for="${input?.id}"]`);
      expect(label?.textContent?.trim()).toBe(text);
    }
  });
});
