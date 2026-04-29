"""Flask application factory."""

from flask import Flask
from flask_cors import CORS

from boundary.auth_routes import auth_bp
from boundary.campaign_routes import campaign_bp
from boundary.donation_routes import donation_bp
from boundary.user_routes import user_bp
from boundary.report_routes import report_bp
from boundary.assessor_routes import assessor_bp
from boundary.compliance_routes import compliance_bp
from boundary.config_routes import config_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "dev-secret-change-in-production"
    CORS(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(campaign_bp, url_prefix="/api/campaigns")
    app.register_blueprint(donation_bp, url_prefix="/api/donations")
    app.register_blueprint(user_bp, url_prefix="/api/admin/users")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(assessor_bp, url_prefix="/api/assessor")
    app.register_blueprint(compliance_bp, url_prefix="/api/compliance")
    app.register_blueprint(config_bp, url_prefix="/api/admin")

    return app


if __name__ == "__main__":
    create_app().run(debug=True, port=5000)
