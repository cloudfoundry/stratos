import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { extractHttpErrorMessage, extractHttpErrorPieces, leadError, leadPieces, stripMarkup } from './jetstream';
import { ErrorPiece } from './upstream-error-text';

const t = (s: string): ErrorPiece => ({ text: s, style: 'text' });
const h = (s: string): ErrorPiece => ({ text: s, style: 'heading' });
const httpError = (error: unknown, status = 502, statusText = 'Bad Gateway'): HttpErrorResponse =>
  new HttpErrorResponse({ error, status, statusText });

// nginx's default 502 page (src/http/ngx_http_special_response.c).
const nginx502 = '<html>\r\n<head><title>502 Bad Gateway</title></head>\r\n<body>\r\n'
  + '<center><h1>502 Bad Gateway</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';

describe('stripMarkup', () => {
  it('keeps the words, drops the tags and collapses whitespace', () => {
    expect(stripMarkup('<p>Plan <b>small</b>\n  is   gone</p>')).toBe('Plan small is gone');
    expect(stripMarkup('no markup here')).toBe('no markup here');
  });

  // The text is a server's error body. A run of '<' with no '>' made the
  // old pattern backtrack quadratically: 100k characters took seconds.
  it('stays linear on unclosed tags', () => {
    const start = performance.now();
    expect(stripMarkup('<'.repeat(100_000) + 'x')).toBe('<'.repeat(100_000) + 'x');
    expect(performance.now() - start).toBeLessThan(500);
    expect(stripMarkup('a < b <i>c</i>')).toBe('a < b c');
  });

  it('reads an HTML error page as its heading and message, one per line', () => {
    expect(stripMarkup(nginx502)).toBe('502 Bad Gateway\nnginx');
  });
});

describe('extractHttpErrorPieces', () => {
  it('reads an HTML page quoted in a CF error detail', () => {
    expect(extractHttpErrorPieces(httpError({ errors: [{ code: 10001, title: 'CF-ServiceBrokerBadResponse', detail: nginx502 }] })))
      .toEqual([h('502 Bad Gateway'), t('\nnginx')]);
  });

  it('reads an HTML page sent as the whole response body', () => {
    expect(extractHttpErrorPieces(httpError(nginx502))).toEqual([h('502 Bad Gateway'), t('\nnginx')]);
  });

  it('passes a plain-text response body through untouched', () => {
    expect(extractHttpErrorPieces(httpError('<nil>'))).toEqual([t('<nil>')]);
    expect(extractHttpErrorMessage(httpError('<nil>'))).toBe('<nil>');
    expect(extractHttpErrorMessage(httpError('a < b\n<i>c</i>  d'))).toBe('a < b\n<i>c</i>  d');
  });

  it('names the HTTP status when an HTML body has no readable text', () => {
    expect(extractHttpErrorMessage(httpError('<html><body><div></div></body></html>'))).toBe('HTTP 502 Bad Gateway');
  });

  it('keeps the pieces an Error carries', () => {
    const err = Object.assign(new Error('502 Bad Gateway nginx'), { pieces: [h('502 Bad Gateway'), t('\nnginx')] });
    expect(extractHttpErrorPieces(err)).toEqual([h('502 Bad Gateway'), t('\nnginx')]);
    expect(extractHttpErrorPieces(new Error('boom'))).toEqual([t('boom')]);
  });
});

describe('leadPieces', () => {
  it('puts the caller\'s lead-in before the message', () => {
    expect(leadPieces('Delete failed', httpError(nginx502)))
      .toEqual([t('Delete failed: '), h('502 Bad Gateway'), t('\nnginx')]);
    expect(leadPieces('Delete failed', new Error('boom'))).toEqual([t('Delete failed: boom')]);
  });
});

describe('leadError', () => {
  it('reads as the lead-in and message, and keeps their pieces', () => {
    const cause = httpError(nginx502);
    const err = leadError('Failed to update organization', cause);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Failed to update organization: 502 Bad Gateway\nnginx');
    expect(err.cause).toBe(cause);
    expect(extractHttpErrorPieces(err))
      .toEqual([t('Failed to update organization: '), h('502 Bad Gateway'), t('\nnginx')]);
  });

  it('gives a plain message as one text piece', () => {
    const err = leadError('Failed to create quota', new Error('boom'));
    expect(err.message).toBe('Failed to create quota: boom');
    expect(extractHttpErrorPieces(err)).toEqual([t('Failed to create quota: boom')]);
  });
});

describe('extractHttpErrorMessage (non-HTTP errors)', () => {
  it('keeps an Error message and a thrown string', () => {
    expect(extractHttpErrorMessage(new Error('boom'))).toBe('boom');
    expect(extractHttpErrorMessage('plain text')).toBe('plain text');
    expect(extractHttpErrorMessage(undefined)).toBe('unknown error');
  });
});
