import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_payment_prompt(user, amount, group_name, cycle_number):
        """
        Simulates sending a Push Notification or SMS to the user to pay their contribution.
        """
        message = (
            f"Njangi Alert! Cycle {cycle_number} for '{group_name}' has started. "
            f"Please contribute {amount} XAF via MTN MoMo / Orange Money to maintain your trust score."
        )
        
        # In a real-world scenario, this would integrate with Expo Push API, Twilio, or Firebase Cloud Messaging.
        # For our MVP/Simulation, we log it to the security/audit trail.
        logger.info(f"[SIMULATED NOTIFICATION] To: {user.phone_number} | Message: {message}")
        
        # Also simulate returning a success payload
        return {
            "status": "success",
            "provider": "simulated",
            "delivered_to": user.phone_number,
            "message": message
        }
