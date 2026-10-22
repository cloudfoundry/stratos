import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { ErrorPiece, htmlToPieces, looksLikeHtml, piecesToText } from './upstream-error-text';

// Real error bodies, byte for byte (.gitattributes keeps their CRLFs).
// Each is transcribed from the server's own source; the values the server
// fills in at run time (versions, hosts, paths, dates) are examples.

const t = (s: string): ErrorPiece => ({ text: s, style: 'text' });
const h = (s: string): ErrorPiece => ({ text: s, style: 'heading' });
const b = (s: string): ErrorPiece => ({ text: s, style: 'strong' });
const code = (s: string): ErrorPiece => ({ text: s, style: 'code' });

const body = (name: string): string =>
  readFileSync(join(import.meta.dirname, 'testdata', 'upstream-errors', `${name}.body`), 'utf8');

interface Golden {
  name: string;
  source: string;
  pieces: ErrorPiece[];
}

const pages: Golden[] = [
  {
    name: 'nginx-502',
    source: 'nginx release-1.28.0 src/http/ngx_http_special_response.c (ngx_http_error_502_page + ngx_http_error_full_tail)',
    pieces: [h('502 Bad Gateway'), t('\nnginx/1.28.0')],
  },
  {
    name: 'nginx-404',
    source: 'nginx release-1.28.0 src/http/ngx_http_special_response.c (ngx_http_error_404_page + ngx_http_error_full_tail)',
    pieces: [h('404 Not Found'), t('\nnginx/1.28.0')],
  },
  {
    name: 'apache-502',
    source: 'Apache httpd 2.4.x modules/http/http_protocol.c (ap_send_error_response, HTTP_BAD_GATEWAY), '
      + 'modules/proxy/proxy_util.c (proxyerror_core), modules/proxy/mod_proxy_http.c, server/core.c (ap_psignature)',
    pieces: [
      h('Proxy Error'),
      t('\nThe proxy server received an invalid response from an upstream server.'
        + '\nThe proxy server could not handle the request\nReason: '),
      b('Error reading from remote server'),
      t('\nApache/2.4.58 (Ubuntu) Server at app.example.com Port 80'),
    ],
  },
  {
    name: 'spring-whitelabel-404',
    source: 'Spring Boot 3.4.x spring-boot-autoconfigure ErrorMvcAutoConfiguration.StaticView',
    pieces: [
      h('Whitelabel Error Page'),
      t('\nThis application has no explicit mapping for /error, so you are seeing this as a fallback.'
        + '\nWed Oct 21 14:03:27 UTC 2026'
        + '\nThere was an unexpected error (type=Not Found, status=404).'
        + '\nNo static resource v2/catalog.'),
    ],
  },
  {
    name: 'tomcat-404',
    source: 'Apache Tomcat 10.1.x java/org/apache/catalina/valves/ErrorReportValve.java, LocalStrings.properties, '
      + 'java/org/apache/catalina/util/TomcatCSS.java',
    pieces: [
      h('HTTP Status 404 – Not Found'),
      t('\n'), b('Type'), t(' Status Report\n'),
      b('Message'), t(' /v2/catalog\n'),
      b('Description'),
      t(' The origin server did not find a current representation for the target resource'
        + ' or is not willing to disclose that one exists.\n'),
      h('Apache Tomcat/10.1.62'),
    ],
  },
  {
    name: 'haproxy-503',
    source: 'HAProxy 3.5-dev src/http.c http_err_msgs[HTTP_ERR_503] (body only)',
    pieces: [h('503 Service Unavailable'), t('\nNo server is available to handle this request.')],
  },
  {
    name: 'haproxy-504',
    source: 'HAProxy 3.5-dev src/http.c http_err_msgs[HTTP_ERR_504] (body only)',
    pieces: [h('504 Gateway Time-out'), t('\nThe server didn\'t respond in time.')],
  },
  {
    name: 'cf-job-detail-504',
    source: 'the HAProxy 504 as Cloud Foundry quotes it in a job error detail '
      + '(cloud-foundry/src/services/async-jobs/write-failure-message.spec.ts)',
    pieces: [t('Status Code: 504 Gateway Timeout, Body:\n'), h('504 Gateway Time-out'), t('\nThe server didn\'t respond in time.')],
  },
  {
    name: 'express-finalhandler-404',
    source: 'pillarjs/finalhandler 2.1.1 index.js createHtmlDocument',
    pieces: [code('Cannot GET /v2/catalog')],
  },
];

// Plain-text bodies are not pages: they read exactly as before.
const plainText: Golden[] = [
  {
    name: 'gorouter-404',
    source: 'cloudfoundry/gorouter main handlers/lookup.go, errorwriter/error_writer.go (plaintextErrorWriter)',
    pieces: [t('404 Not Found: Requested route (\'myapp.apps.example.com\') does not exist.')],
  },
  {
    name: 'gorouter-503',
    source: 'cloudfoundry/gorouter main handlers/lookup.go, errorwriter/error_writer.go (plaintextErrorWriter)',
    pieces: [t('503 Service Unavailable: Requested route (\'myapp.apps.example.com\') has no available endpoints.')],
  },
  {
    name: 'envoy-no-healthy-upstream',
    source: 'Envoy v1.33.0 source/common/router/router.cc (sendNoHealthyUpstreamResponse)',
    pieces: [t('no healthy upstream')],
  },
  {
    name: 'envoy-upstream-connect-error',
    source: 'Envoy v1.33.0 source/common/router/router.cc (onUpstreamReset), source/common/http/utility.cc',
    pieces: [t('upstream connect error or disconnect/reset before headers. reset reason: remote connection failure, '
      + 'transport failure reason: delayed connect error: 111')],
  },
  {
    name: 'envoy-upstream-connect-error-legacy',
    source: 'Envoy v1.17.0 source/common/router/router.cc (onUpstreamReset), source/common/http/utility.cc',
    pieces: [t('upstream connect error or disconnect/reset before headers. reset reason: connection failure')],
  },
];

describe('htmlToPieces on real upstream error pages', () => {
  it.each(pages)('reads $name ($source)', ({ name, pieces }) => {
    const page = body(name);
    expect(looksLikeHtml(page)).toBe(true);
    expect(htmlToPieces(page)).toEqual(pieces);
  });

  it('keeps the CRLF line endings of the nginx fixtures', () => {
    expect(body('nginx-502')).toContain('</title></head>\r\n<body>\r\n');
  });
});

describe('htmlToPieces on real plain-text error bodies', () => {
  it.each(plainText)('reads $name ($source) unchanged', ({ name, pieces }) => {
    const text = body(name);
    expect(looksLikeHtml(text)).toBe(false);
    expect(htmlToPieces(text)).toEqual(pieces);
    expect(piecesToText(htmlToPieces(text))).toBe(text.trim());
  });
});
