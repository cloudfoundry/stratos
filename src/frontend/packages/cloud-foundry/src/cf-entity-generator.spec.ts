import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UserFavorite } from '@stratosui/store';
import { applicationEntityType, organizationEntityType, spaceEntityType } from './cf-entity-types';
import { generateCFEntities } from './cf-entity-generator';

// Favorites validation (getIsValid) must probe the entity's existence with a
// direct HTTP GET against the same jetstream URL the old ngrx pipeline hit —
// 200 => valid, any error => invalid (the favorite's entity was deleted).
describe('generateCFEntities getIsValid existence probe', () => {
  let httpMock: HttpTestingController;

  const ENDPOINT = 'cnsi-1';
  const ENTITY = 'guid-1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  const findValidator = (type: string) => {
    const entity = generateCFEntities().find(e => e.definition.type === type);
    expect(entity, `entity ${type} not found`).toBeTruthy();
    const getIsValid = entity!.builders.entityBuilder?.getIsValid;
    expect(getIsValid, `getIsValid for ${type} not defined`).toBeTruthy();
    const favorite = { entityId: ENTITY, endpointId: ENDPOINT } as UserFavorite;
    return () => TestBed.runInInjectionContext(() => getIsValid!(favorite));
  };

  const cases: { type: string; url: string }[] = [
    { type: applicationEntityType, url: `/pp/v1/cf/apps/${ENDPOINT}/${ENTITY}` },
    { type: spaceEntityType, url: `/pp/v1/cf/spaces/${ENDPOINT}/${ENTITY}` },
    { type: organizationEntityType, url: `/pp/v1/cf/org/${ENDPOINT}/${ENTITY}` },
  ];

  for (const { type, url } of cases) {
    it(`${type}: emits true when the GET ${url} succeeds`, async () => {
      const result = firstValueFrom(findValidator(type)());
      httpMock.expectOne(url).flush({});
      expect(await result).toBe(true);
    });

    it(`${type}: emits false when the GET ${url} errors`, async () => {
      const result = firstValueFrom(findValidator(type)());
      httpMock.expectOne(url).error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
      expect(await result).toBe(false);
    });
  }

  afterEach(() => httpMock.verify());
});
