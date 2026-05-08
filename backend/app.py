"""Flask application factory."""

import os
from flask import Flask, jsonify
from flask_cors import CORS

from boundary.auth_routes import auth_bp
from boundary.campaign_routes import campaign_bp
from boundary.donation_routes import donation_bp
from boundary.user_routes import user_bp
from boundary.report_routes import report_bp
from boundary.assessor_routes import assessor_bp
from boundary.compliance_routes import compliance_bp
from boundary.config_routes import config_bp
from boundary.upload_routes import upload_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    app.config["UPLOAD_FOLDER"] = os.environ.get(
        "UPLOAD_FOLDER",
        os.path.join(os.path.dirname(__file__), "uploads"),
    )
    app.config["MAX_CONTENT_LENGTH"] = int(
        os.environ.get("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)
    )
    cors_origin = os.environ.get("CORS_ORIGIN", "*")
    CORS(app, resources={r"/api/*": {"origins": cors_origin}})

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(campaign_bp, url_prefix="/api/campaigns")
    app.register_blueprint(donation_bp, url_prefix="/api/donations")
    app.register_blueprint(user_bp, url_prefix="/api/admin/users")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(assessor_bp, url_prefix="/api/assessor")
    app.register_blueprint(compliance_bp, url_prefix="/api/compliance")
    app.register_blueprint(config_bp, url_prefix="/api/admin")
    app.register_blueprint(upload_bp, url_prefix="/api/uploads")

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok"}), 200

    return app


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    port = int(os.environ.get("PORT", 5000))
    create_app().run(debug=debug, host="0.0.0.0", port=port)
