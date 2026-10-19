import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CfUserServiceTestProvider } from '@test-framework/cf';

// The shared provider bundle must leave requests on the testing backend, so a
// spec that uses it can expect and flush them instead of seeing them throw.
describe('CfUserServiceTestProvider', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...CfUserServiceTestProvider],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('routes a request to HttpTestingController', () => {
    let body: unknown;
    let error: unknown;
    TestBed.inject(HttpClient).get('/pp/v1/probe').subscribe({
      next: value => { body = value; },
      error: err => { error = err; },
    });

    expect(error).toBeUndefined();
    httpMock.expectOne('/pp/v1/probe').flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });
});
