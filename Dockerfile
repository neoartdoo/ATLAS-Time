# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (c) 2026 Marjan Panic. Free for noncommercial use; see LICENSE.

# Small image: only the Python standard library is used, nothing is installed.
FROM python:3.13-alpine
WORKDIR /app
# Only the server and the web UI go into the image (see .dockerignore).
COPY server.py ./
COPY web ./web
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
# Run as the unprivileged "nobody" user.
USER 65534:65534
# Container port; compose.yaml maps it to CLOCK_PORT on the host.
EXPOSE 8080
# /health is answered by server.py.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health',timeout=3)"
CMD ["python", "server.py"]
