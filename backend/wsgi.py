"""WSGI entrypoint for production hosting."""

from app import create_app

app = create_app()
