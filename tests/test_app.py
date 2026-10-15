import copy
import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, build_opener, ProxyHandler
from unittest.mock import patch

import app

BRIEF = "Please build a one-page website and a contact form."
SCOPE = {"title": "Studio website", "summary": "A simple inquiry website.",
         "deliverables": [{"name": "One-page site", "evidence": BRIEF, "hours": 5}],
         "questions": ["Who provides copy?"], "assumptions": [], "out_of_scope": ["Hosting fees"]}


class ValidationTests(unittest.TestCase):
    def test_rounding_and_deposit_conserve_total(self):
        q = app.quote([0.5, 1.25], 19.99, 13, 33)
        self.assertEqual(q, {"base": 34.98, "buffer": 4.55, "total": 39.53, "deposit": 13.04, "balance": 26.49})

    def test_sample_quote(self):
        self.assertEqual(app.quote([5, 3, 3, 2], 50, 15, 50)["total"], 747.5)

    def test_invalid_numbers_never_produce_quotes(self):
        for value in [True, -1, float("nan"), float("inf"), "20", None]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                app.quote([2], value, 15, 50)

    def test_grounded_deliverable(self):
        self.assertEqual(app.validate_scope(SCOPE, BRIEF), SCOPE)

    def test_invented_evidence_is_rejected(self):
        scope = copy.deepcopy(SCOPE)
        scope["deliverables"][0]["evidence"] = "online payment system"
        with self.assertRaisesRegex(ValueError, "not found"):
            app.validate_scope(scope, BRIEF)

    def test_oversized_or_wrong_shape_output(self):
        for key, value in [("title", ""), ("deliverables", []), ("assumptions", "all done")]:
            scope = copy.deepcopy(SCOPE)
            scope[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                app.validate_scope(scope, BRIEF)

    def test_cloud_model_rejected_before_network(self):
        with self.assertRaisesRegex(ValueError, "cloud"):
            app.generate(BRIEF, "model:cloud")

    def test_gemma_default_and_compatible_turns(self):
        self.assertEqual(app.MODEL, "gemma3:1b")
        with patch.object(app, "ollama", return_value={"message": {"content": json.dumps(SCOPE)}}) as runner:
            app.generate(BRIEF)
        payload = runner.call_args.args[1]
        self.assertEqual(payload["model"], "gemma3:1b")
        self.assertEqual([turn["role"] for turn in payload["messages"]], ["user"])
        self.assertIn("CLIENT_BRIEF_JSON", payload["messages"][0]["content"])

    def test_unmatched_task_retries_once_then_recovers(self):
        bad = copy.deepcopy(SCOPE)
        bad["deliverables"][0]["name"] = "Payment gateway setup"
        responses = [{"message": {"content": json.dumps(s)}} for s in [bad, SCOPE]]
        with patch.object(app, "ollama", side_effect=responses) as runner:
            self.assertEqual(app.generate(BRIEF), SCOPE)
        self.assertEqual(runner.call_count, 2)
        self.assertIn("previous attempt failed", runner.call_args.args[1]["messages"][0]["content"])

    def test_invalid_output_has_bounded_retry(self):
        with patch.object(app, "ollama", return_value={"message": {"content": "not JSON"}}) as runner:
            with self.assertRaisesRegex(ValueError, "two attempts"):
                app.generate(BRIEF)
        self.assertEqual(runner.call_count, 2)

    def test_evidence_choices_are_bounded_verbatim_passages(self):
        brief = 'First sentence.\n' + 'very long brief ' * 100 + '\nLast request!'
        passages = app.source_passages(brief)
        self.assertGreater(len(passages), 2)
        self.assertTrue(all(p in brief and 0 < len(p) <= 400 for p in passages))
        self.assertEqual(len(passages), len(set(passages)))

    def test_source_links_use_task_words_and_mobile_alias(self):
        brief = 'Hello! Please build a contact form. Make it work on phones.'
        data = {"deliverables": [{"name": "Contact Form"}, {"name": "Responsive design"}]}
        linked = app.attach_source_evidence(data, brief)
        self.assertEqual(linked["deliverables"][0]["evidence"], 'Please build a contact form.')
        self.assertEqual(linked["deliverables"][1]["evidence"], 'Make it work on phones.')

    def test_greeting_is_not_valid_task_evidence(self):
        data = copy.deepcopy(SCOPE)
        data["deliverables"][0]["evidence"] = 'Hello!'
        with self.assertRaisesRegex(ValueError, 'does not mention'):
            app.validate_scope(data, 'Hello! ' + BRIEF)


class FakeOllama(BaseHTTPRequestHandler):
    payload = None
    content = json.dumps(SCOPE)

    def log_message(self, *_):
        pass

    def do_POST(self):
        FakeOllama.payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        body = json.dumps({"message": {"content": FakeOllama.content}}).encode()
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fake = ThreadingHTTPServer(("127.0.0.1", 0), FakeOllama)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        for server in [cls.fake, cls.server]:
            threading.Thread(target=server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.client = build_opener(ProxyHandler({}))

    @classmethod
    def tearDownClass(cls):
        for server in [cls.fake, cls.server]:
            server.shutdown()
            server.server_close()

    def request(self, path, data=None, headers=None):
        request = Request(self.base + path, data=json.dumps(data).encode() if data is not None else None,
                          headers={"Content-Type": "application/json", **(headers or {})})
        return self.client.open(request, timeout=5)

    def test_page_assets_and_traversal(self):
        for path in ["/", "/style.css", "/app.js"]:
            with self.request(path) as response:
                self.assertEqual(response.status, 200)
                self.assertIn("frame-ancestors 'none'", response.headers["Content-Security-Policy"])
        with self.assertRaises(HTTPError) as error:
            self.request("/../app.py")
        self.assertEqual(error.exception.code, 404)

    def test_quote_over_http(self):
        with self.request("/api/quote", {"hours": [5, 3, 3, 2], "rate": 50, "buffer": 15, "deposit": 50}) as response:
            self.assertEqual(json.load(response)["total"], 747.5)

    def test_cross_origin_and_bad_host_are_rejected(self):
        for headers in [{"Origin": "https://example.com"}, {"Host": "evil.example"}]:
            with self.subTest(headers=headers), self.assertRaises(HTTPError) as error:
                self.request("/api/quote", {}, headers)
            self.assertEqual(error.exception.code, 403)

    def test_non_object_request_is_rejected(self):
        with self.assertRaises(HTTPError) as error:
            self.request("/api/generate", ["not", "an", "object"])
        self.assertEqual(error.exception.code, 400)

    def test_generation_adapter_uses_schema_and_validates_output(self):
        url = f"http://127.0.0.1:{self.fake.server_port}"
        with patch.object(app, "OLLAMA", url):
            FakeOllama.content = json.dumps(SCOPE)
            with self.request("/api/generate", {"brief": BRIEF}) as response:
                self.assertEqual(json.load(response), SCOPE)
            properties = FakeOllama.payload["format"]["properties"]["deliverables"]["items"]["properties"]
            self.assertNotIn("evidence", properties)
            self.assertFalse(FakeOllama.payload["stream"])
            FakeOllama.content = "not JSON"
            with self.assertRaises(HTTPError) as error:
                self.request("/api/generate", {"brief": BRIEF})
            self.assertEqual(error.exception.code, 400)
            FakeOllama.content = json.dumps(SCOPE)

    def test_unavailable_model_runner_is_actionable(self):
        with patch.object(app, "ollama", side_effect=TimeoutError()):
            with self.request("/api/status") as response:
                self.assertFalse(json.load(response)["online"])
            with self.assertRaises(HTTPError) as error:
                self.request("/api/generate", {"brief": BRIEF})
            self.assertEqual(error.exception.code, 503)
            self.assertIn("Ollama", json.load(error.exception)["error"])


if __name__ == "__main__":
    unittest.main()
