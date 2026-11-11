"""Runs an ephemeral local server; no network services are left running."""
import importlib.util
import json
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path
spec = importlib.util.spec_from_file_location('clock_server', Path(__file__).resolve().parents[1] / 'server.py')
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = app.ThreadingHTTPServer(('127.0.0.1', 0), app.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_time(self):
        with urllib.request.urlopen(self.url + '/api/time') as response:
            stamp = json.load(response)['unix_ms']
            self.assertLess(abs(stamp - time.time() * 1000), 1000)
            self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_assets_and_health(self):
        for path in ['/', '/help', '/help/', '/help.css', '/help.mjs', '/analog-3', '/analog-3/', '/analog3.mjs', '/analog3-core.mjs', '/analog', '/analog/', '/analog.css', '/analog.mjs', '/analog-core.mjs', '/stardate.mjs', '/history', '/history/', '/history.mjs', '/history-core.mjs', '/history.css', '/calendar', '/calendar/', '/calendar?year=1026', '/calendar?year=3026', '/app.mjs', '/year.mjs', '/calendar-ui.mjs', '/clock.mjs', '/style.css', '/health']:
            with urllib.request.urlopen(self.url + path) as response:
                self.assertEqual(response.status, 200)
                self.assertGreater(len(response.read()), 0)

    def test_languages_and_query_precedence(self):
        for path in ['/', '/calendar?year=1026', '/history', '/analog', '/analog-3', '/help']:
            for cookie, language in [('', 'en'), ('atlas_lang=sr', 'sr-Latn'), ('atlas_lang=en', 'en'), ('atlas_lang=../../server.py', 'en')]:
                request = urllib.request.Request(self.url + path, headers={'Cookie': cookie})
                with urllib.request.urlopen(request) as response:
                    body = response.read().decode()
                    self.assertIn(f'<html lang="{language}">', body)
                    self.assertEqual(response.headers['Content-Language'], language)
                    self.assertIn('PERSONAL TIME', body)
                    self.assertIn('id="language"', body)
            separator = '&' if '?' in path else '?'
            request = urllib.request.Request(self.url + path + separator + 'lang=en', headers={'Cookie': 'atlas_lang=sr'})
            with urllib.request.urlopen(request) as response:
                self.assertIn('<html lang="en">', response.read().decode())
        with urllib.request.urlopen(self.url + '/i18n.mjs') as response:
            self.assertIn('text/javascript', response.headers['Content-Type'])

    def test_private_files_not_served(self):
        for path in ['/server.py', '/compose.yaml', '/../server.py', '/%2e%2e/server.py']:
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(self.url + path)
            self.assertEqual(error.exception.code, 404)

if __name__ == '__main__':
    unittest.main()
