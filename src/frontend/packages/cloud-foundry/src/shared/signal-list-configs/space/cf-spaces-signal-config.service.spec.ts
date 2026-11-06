import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EMPTY } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import type { DeleteEvent } from '../../../services/deletes/delete-event.types';
import { CfSpacesSignalConfigService } from './cf-spaces-signal-config.service';

const SPACES_P1 = '/pp/v1/cf/org/cf-1/org-1/spaces?per_page=500&page=1';
const sp = (guid: string) => ({ guid, name: guid, orgGuid: 'org-1', cnsiGuid: 'cf-1', createdAt: '', updatedAt: '' });

describe('CfSpacesSignalConfigService', () => {
  let svc: CfSpacesSignalConfigService;
  let httpMock: HttpTestingController;
  let deleteState: DeleteEvent['state'];

  const fakeController = {
    delete: () => ({
      events$: EMPTY,
      done: Promise.resolve({ state: deleteState } as DeleteEvent),
    }),
  };

  beforeEach(() => {
    deleteState = 'success';
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EntityDeleteController, useValue: fakeController },
        CfSpacesSignalConfigService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(CfSpacesSignalConfigService);
  });

  const initWithSpaces = async () => {
    svc.initialize('cf-1', 'org-1');
    httpMock.expectOne(SPACES_P1).flush({
      resources: [sp('sp-1'), sp('sp-2')],
      pagination: { totalResults: 2, totalPages: 1 },
    });
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    expect(svc.spaces().map(s => s.guid)).toEqual(['sp-1', 'sp-2']);
  };

  it('evicts the deleted row from the org-scoped list on delete success', async () => {
    await initWithSpaces();
    await svc.deleteSpace('cf-1', 'sp-1');
    expect(svc.spaces().map(s => s.guid)).toEqual(['sp-2']);
  });

  it('keeps the row when the delete fails', async () => {
    await initWithSpaces();
    deleteState = 'failure';
    await expect(svc.deleteSpace('cf-1', 'sp-1')).rejects.toBeTruthy();
    expect(svc.spaces().map(s => s.guid)).toEqual(['sp-1', 'sp-2']);
  });
});
