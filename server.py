# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
"""ATLAS Personal Time server.

Serves the static web UI and one read-only endpoint, /api/time, that returns the
host's Unix time in milliseconds. Python standard library only: no dependencies,
no database, no cookies except the `atlas_lang` language preference, no tracking.

Configuration (environment variables):
  PORT                  port inside the container (default 8080)
  CLOCK_EMBED_ORIGINS   space-separated origins that may embed /?embed=1 in an
                        <iframe> (for example a dashboard); empty = nobody
"""
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from http.cookies import SimpleCookie, CookieError

WEB = Path(__file__).resolve().parent / 'web'

# Origins allowed to embed the compact clock view. Read once at startup.
EMBED_ORIGINS = os.environ.get('CLOCK_EMBED_ORIGINS', '').split()

# HTML pages: URL path -> file name. English versions live in web/en/ and are
# chosen per request by language; shared CSS and JS modules live in web/.
PAGES = {
    '/': 'index.html', '/index.html': 'index.html',
    '/calendar': 'index.html', '/calendar/': 'index.html',  # annual view = same page, see year.mjs
    '/analog': 'analog.html', '/analog/': 'analog.html',
    '/analog-3': 'analog3.html', '/analog-3/': 'analog3.html',
    '/history': 'history.html', '/history/': 'history.html',
    '/help': 'help.html', '/help/': 'help.html',
}
STYLES = ['style.css', 'analog.css', 'history.css', 'help.css']
SCRIPTS = ['i18n.mjs', 'clock.mjs', 'stardate.mjs', 'calendar-ui.mjs', 'year.mjs', 'app.mjs',
           'analog-core.mjs', 'analog.mjs', 'analog3-core.mjs', 'analog3.mjs',
           'history-core.mjs', 'history.mjs', 'help.mjs']

# Allow-list of everything that can be served: path -> (file name, MIME type).
# Anything not listed is a 404, so there is no way to read other files (server.py, tests, ...).
ASSETS = {path: (name, 'text/html') for path, name in PAGES.items()}
ASSETS.update({'/' + name: (name, 'text/css') for name in STYLES})
ASSETS.update({'/' + name: (name, 'text/javascript') for name in SCRIPTS})

# Extra CSS injected into / when it is loaded with ?embed=1: hides everything except the clock panel.
EMBED_STYLE = '<style>\nbody.atlas-embed{margin:0;min-height:0;background:#0c1418;color:#e5edf1;overflow:hidden}\nbody.atlas-embed main{margin:0;padding:0;max-width:none;min-height:0}\nbody.atlas-embed main> :not(.clock-panel){display:none!important}\nbody.atlas-embed .clock-panel{margin:0;padding:10px 12px;border:0;border-radius:0;box-shadow:none;min-height:0}\nbody.atlas-embed .digits{display:flex;justify-content:center;gap:4px;margin:10px 0;font-size:clamp(20px,7vw,44px)}\nbody.atlas-embed .digits span{font-size:inherit;line-height:1.1}\nbody.atlas-embed .digits b{font-size:inherit}\nbody.atlas-embed .digits small{font-size:8px;letter-spacing:.08em}\nbody.atlas-embed .digits .fraction,body.atlas-embed .digits>b:last-of-type,\nbody.atlas-embed .comparison,body.atlas-embed .track-label,\nbody.atlas-embed .star-math,body.atlas-embed details,body.atlas-embed .star-labels{display:none!important}\nbody.atlas-embed .panel-top{font-size:9px;gap:4px}\nbody.atlas-embed .panel-top .eyebrow{font-size:9px;letter-spacing:.08em}\nbody.atlas-embed .stardate-panel{margin:8px 0 0;padding:7px 0 0}\nbody.atlas-embed .stardate-panel .panel-top>span:last-child{display:none}\nbody.atlas-embed .star-display{font-size:clamp(14px,5.4vw,28px);line-height:1.3;margin:4px 0;white-space:nowrap}\nbody.atlas-embed .day-track{margin-top:6px;height:3px}\n</style>'


class Handler(BaseHTTPRequestHandler):
    server_version = 'ATLASPersonalTime/1.8'

    def do_GET(self):
        url = urlsplit(self.path)
        route = url.path

        # Interface language: ?lang=en|sr wins over the atlas_lang cookie; English is the default.
        language = 'en'
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get('Cookie', ''))
            if 'atlas_lang' in cookie and cookie['atlas_lang'].value in ('en', 'sr'):
                language = cookie['atlas_lang'].value
        except CookieError:
            pass
        requested = parse_qs(url.query).get('lang', [''])[0]
        if requested in ('en', 'sr'):
            language = requested

        if route == '/api/time':
            # The only dynamic endpoint: host Unix time, read-only. Clients estimate
            # their offset from it (see syncTime in web/app.mjs).
            body = json.dumps({'unix_ms': time.time_ns() // 1000000}).encode()
            mime = 'application/json'
        elif route == '/health':
            # Used by the Docker HEALTHCHECK.
            body, mime = b'{"ok":true}', 'application/json'
        elif route in ASSETS:
            name, mime = ASSETS[route]
            # English HTML lives in web/en/, Serbian HTML in web/.
            body = (WEB / ('en/' + name if mime == 'text/html' and language == 'en' else name)).read_bytes()
        else:
            self.send_error(404)
            return

        # Compact embeddable clock: /?embed=1 gets a body class and the extra CSS above.
        embedded = route in ('/', '/index.html') and parse_qs(url.query).get('embed') == ['1']
        if embedded:
            body = body.replace(b'<body>', b'<body class="atlas-embed">').replace(b'</head>', EMBED_STYLE.encode() + b'</head>')

        self.send_response(200)
        self.send_header('Content-Type', mime + '; charset=utf-8')
        if mime == 'text/html':
            self.send_header('Content-Language', 'sr-Latn' if language == 'sr' else 'en')
            self.send_header('Vary', 'Cookie')
        self.send_header('Content-Length', str(len(body)))
        # The time must never come from a cache.
        self.send_header('Cache-Control', 'no-store')
        # Hardening headers: no MIME sniffing, no referrer, same-origin scripts only.
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        # frame-ancestors decides who may put the page in an iframe: only the embed view,
        # and only for the origins listed in CLOCK_EMBED_ORIGINS.
        ancestors = ' '.join(["'self'"] + EMBED_ORIGINS) if embedded else "'self'"
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors " + ancestors)
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8080'))), Handler).serve_forever()
