# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
"""Build a static copy of ATLAS Personal Time for GitHub Pages.

    python3 tools/build_demo.py [output_dir]      (default: _site)

server.py normally picks the page language per request and serves absolute URLs
(/style.css, /history, ...). GitHub Pages is static and lives under a sub-path
(/ATLAS-Time/), so this script writes:

    <out>/index.html, calendar/, analog/, analog-3/, history/, help/   English
    <out>/sr/...                                                       Serbian
    <out>/*.css, *.mjs                                                 shared assets

and rewrites the absolute links to relative ones. Each page also gets
<link rel="alternate" hreflang> tags that web/i18n.mjs uses for the language switch.
There is no /api/time in the demo: the clocks fall back to the visitor's device time,
which is stated in a banner. Python standard library only.
"""
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / '_site'
REPO_URL = 'https://github.com/neoartdoo/ATLAS-Time'

# route directory -> source page name (same table as PAGES in server.py)
ROUTES = {'': 'index', 'calendar': 'index', 'analog': 'analog', 'analog-3': 'analog3',
          'history': 'history', 'help': 'help'}
LANGS = {'en': '', 'sr': 'sr'}   # language -> sub-tree of the output
BANNER = {
    'en': 'Static demo: no server, so the time comes from your device. '
          f'Run it yourself for server sync: <a href="{REPO_URL}" style="color:#c9f58c">GitHub</a>',
    'sr': 'Statički demo: nema servera, pa se koristi vreme vašeg uređaja. '
          f'Za sinhronizaciju sa serverom pokrenite sami: <a href="{REPO_URL}" style="color:#c9f58c">GitHub</a>',
}


def rel(from_dir: str, to_dir: str) -> str:
    """Relative URL (with trailing slash) between two directories of the output tree."""
    path = os.path.relpath(to_dir or '.', from_dir or '.').replace(os.sep, '/')
    return './' if path == '.' else path + '/'


def build_page(lang: str, route: str) -> str:
    html = (WEB / ('en' if lang == 'en' else '.') / (ROUTES[route] + '.html')).read_text(encoding='utf-8')
    tree = LANGS[lang]
    page_dir = '/'.join(p for p in (tree, route) if p)      # where this page is written
    to_assets = rel(page_dir, '')                            # path back to the output root
    to_tree = rel(page_dir, tree)                            # path back to this language's home

    def link(match):
        attr, target = match.group(1), match.group(2)
        if target == '':                       # "/"            -> language home
            return f'{attr}="{to_tree}"'
        if target in ROUTES:                   # "/history"     -> <tree>/history/
            return f'{attr}="{rel(page_dir, "/".join(p for p in (tree, target) if p))}"'
        if target == 'health':                 # "/health"      -> static stand-in file
            return f'{attr}="{to_assets}health.json"'
        return f'{attr}="{to_assets}{target}"'  # css / mjs     -> shared assets at the root

    html = re.sub(r'(href|src)="/([^"]*)"', link, html)
    alternates = ''.join(
        f'<link rel="alternate" hreflang="{code}" href="{rel(page_dir, "/".join(p for p in (sub, route) if p))}">'
        for code, sub in LANGS.items())
    html = html.replace('</head>', alternates + '</head>', 1)
    banner = ('<div style="background:#1b2a1d;color:#c9f58c;text-align:center;font:13px system-ui,sans-serif;'
              f'padding:6px 12px">{BANNER[lang]}</div>')
    return html.replace('<body>', '<body>' + banner, 1)


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for asset in list(WEB.glob('*.css')) + list(WEB.glob('*.mjs')):
        shutil.copy(asset, OUT / asset.name)
    (OUT / 'health.json').write_text('{"ok":true,"demo":true}\n')
    (OUT / '.nojekyll').write_text('')                      # serve files as they are
    for lang, tree in LANGS.items():
        for route in ROUTES:
            target = OUT.joinpath(*(p for p in (tree, route) if p)) / 'index.html'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(build_page(lang, route), encoding='utf-8')
    print(f'built {len(LANGS) * len(ROUTES)} pages into {OUT}')


if __name__ == '__main__':
    main()
