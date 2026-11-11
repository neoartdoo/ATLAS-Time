# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.
"""The static demo must work under a sub-path: no absolute links, both languages, language alternates."""
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ['', 'calendar', 'analog', 'analog-3', 'history', 'help']


class DemoBuildTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name) / 'site'
        subprocess.run([sys.executable, '-I', str(ROOT / 'tools' / 'build_demo.py'), str(cls.out)], check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def pages(self):
        for tree in ('', 'sr'):
            for route in ROUTES:
                path = self.out.joinpath(*(p for p in (tree, route) if p)) / 'index.html'
                self.assertTrue(path.exists(), path)
                yield tree, route, path.read_text(encoding='utf-8')

    def test_no_absolute_links(self):
        for tree, route, html in self.pages():
            self.assertEqual(re.findall(r'(?:href|src)="/[^"]*"', html), [], (tree, route))

    def test_language_alternates_and_banner(self):
        for tree, route, html in self.pages():
            self.assertIn('hreflang="en"', html)
            self.assertIn('hreflang="sr"', html)
            self.assertIn('Static demo' if tree == '' else 'Statički demo', html)
            self.assertIn('<html lang="' + ('sr-Latn' if tree else 'en'), html)

    def test_linked_assets_exist(self):
        for tree, route, html in self.pages():
            base = self.out.joinpath(*(p for p in (tree, route) if p))
            for target in re.findall(r'(?:href|src)="(\.[^"#?]*\.(?:css|mjs))"', html):
                self.assertTrue((base / target).resolve().exists(), (tree, route, target))


if __name__ == '__main__':
    unittest.main()
