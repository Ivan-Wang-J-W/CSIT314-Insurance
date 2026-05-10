"""
Assessor routes — AS-02 (verify identity), AS-04 (flag fraud), AS-09 (withdrawal hold).
BCE layer: Boundary
"""

# Import Flask tools for routing, reading requests, sending JSON, and the request-global object
from flask import Blueprint, request, jsonify, g

# Import the controller module that holds the actual business logic
import control.assessor_controller as assessor_ctrl
# Import the role-checking decorator so only certain users can access these endpoints
from boundary.utils import require_role

# Create a Blueprint to group all assessor-related routes together
assessor_bp = Blueprint("assessor", __name__)


# Route: POST request to verify the identity of a campaign organiser
@assessor_bp.post("/campaigns/<campaign_id>/verify-identity")
# Only users with the ASSESSOR role are allowed to call this
@require_role("ASSESSOR")
def verify_identity(campaign_id):
    """AS-02: verify identity of campaign organiser."""
    # Get the JSON body from the request (use empty dict if none was sent)
    data = request.get_json() or {}
    try:
        # Pass the data to the controller to do the actual verification
        result = assessor_ctrl.verify_identity(
            campaign_id=campaign_id,
            assessor_id=g.current_user["id"],   # ID of the logged-in assessor
            documents=data.get("documents", []),  # List of supporting documents
            notes=data.get("notes", ""),          # Optional notes from the assessor
        )
        # Send back the verification result with HTTP 200 (OK)
        return jsonify({"verification": result}), 200
    except ValueError as e:
        # If something is invalid, send back the error with HTTP 400 (Bad Request)
        return jsonify({"error": str(e)}), 400


# Route: POST request to flag a campaign as fraudulent
@assessor_bp.post("/campaigns/<campaign_id>/flag-fraud")
# Only ASSESSORs can flag fraud
@require_role("ASSESSOR")
def flag_fraud(campaign_id):
    """AS-04: flag campaign as potentially fraudulent and escalate."""
    # Read JSON body from the request
    data = request.get_json() or {}
    try:
        # Ask the controller to record the fraud report and escalate it
        report = assessor_ctrl.flag_as_fraudulent(
            campaign_id=campaign_id,
            assessor_id=g.current_user["id"],  # Who is reporting
            reason=data.get("reason", ""),     # Why it's being flagged
        )
        # Return the new fraud report with HTTP 201 (Created)
        return jsonify({"fraud_report": report}), 201
    except ValueError as e:
        # Return error message if input was invalid
        return jsonify({"error": str(e)}), 400


# Route: POST request to place a hold on withdrawals for a campaign
@assessor_bp.post("/campaigns/<campaign_id>/withdrawal-hold")
# Only ASSESSORs can place a hold
@require_role("ASSESSOR")
def place_hold(campaign_id):
    """AS-09: place temporary hold on fund withdrawals under investigation."""
    # Read JSON body from the request
    data = request.get_json() or {}
    try:
        # Ask the controller to create the withdrawal hold
        hold = assessor_ctrl.place_withdrawal_hold(
            campaign_id=campaign_id,
            assessor_id=g.current_user["id"],  # Assessor placing the hold
            reason=data.get("reason", ""),     # Reason for the hold
        )
        # Return the new hold record with HTTP 201 (Created)
        return jsonify({"hold": hold}), 201
    except ValueError as e:
        # Send error back with HTTP 400 if input was invalid
        return jsonify({"error": str(e)}), 400


# Route: DELETE request to lift (remove) an existing withdrawal hold
@assessor_bp.delete("/campaigns/<campaign_id>/withdrawal-hold")
# Both ASSESSORs and ADMINs are allowed to lift a hold
@require_role("ASSESSOR", "ADMIN")
def lift_hold(campaign_id):
    try:
        # Ask the controller to lift the hold for this campaign
        hold = assessor_ctrl.lift_withdrawal_hold(campaign_id)
        # Return the updated hold info with HTTP 200 (OK)
        return jsonify({"hold": hold}), 200
    except ValueError as e:
        # Return error if something went wrong (e.g., no hold exists)
        return jsonify({"error": str(e)}), 400


# Route: GET request to check the identity verification status of a campaign
@assessor_bp.get("/campaigns/<campaign_id>/identity-status")
# ASSESSORs, COMPLIANCE staff, and ADMINs can view this
@require_role("ASSESSOR", "COMPLIANCE", "ADMIN")
def identity_status(campaign_id):
    try:
        # Ask the controller for the current identity status, return as JSON
        return jsonify(assessor_ctrl.get_identity_status(campaign_id)), 200
    except ValueError as e:
        # If campaign isn't found, return error with HTTP 404 (Not Found)
        return jsonify({"error": str(e)}), 404
