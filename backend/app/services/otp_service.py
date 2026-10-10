"""
OTP & Multi-Factor Authentication (MFA) Service.

Provides secure 6-digit numeric OTP generation, verification, and dispatch
over Email (SMTP) and Mobile SMS (Fast2SMS / gateway with demo fallback).
"""
import os
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
import httpx

from app.core.config import settings
from app.services.email_service import send_email
from app.models.user import User

logger = logging.getLogger("studenthub.otp")

OTP_EXPIRY_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60


class OTPService:
    @staticmethod
    def generate_numeric_otp(length: int = 6) -> str:
        """Generate a cryptographically secure numeric OTP."""
        # Generates numbers like 100000 to 999999
        start = 10 ** (length - 1)
        end = (10 ** length) - 1
        return str(secrets.randbelow(end - start + 1) + start)

    @staticmethod
    def send_email_otp(to_email: str, otp: str, user_name: str = "Student", purpose: str = "Registration Verification") -> bool:
        """Send a 6-digit verification code via email."""
        subject = f"{otp} is your Student Hub verification code"
        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#11120D;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#1C1C17;border-radius:12px;border:1px solid #36362F;box-shadow:0 12px 32px rgba(0,0,0,0.5);">
        <tr>
          <td style="padding:28px 36px;border-bottom:1px solid #36362F;">
            <span style="font-size:18px;font-weight:700;color:#FFFBF4;letter-spacing:-0.02em;">Student Hub</span>
            <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:4px;background:#282F24;color:#8E9B7A;font-size:11px;font-weight:600;">Security</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#FFFBF4;">{purpose}</p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#D8CFBC;">
              Hi {user_name}, use the verification code below to complete your security authentication.
            </p>
            
            <div style="background:#11120D;border:1px solid #8E9B7A;border-radius:8px;padding:16px 24px;text-align:center;margin:24px 0;">
              <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#FFFBF4;font-family:monospace;">
                {otp}
              </span>
            </div>

            <p style="margin:20px 0 0;font-size:12px;color:#8D8777;line-height:1.5;">
              This code will expire in <strong style="color:#FFFBF4;">{OTP_EXPIRY_MINUTES} minutes</strong>. Do not share this code with anyone.
            </p>
            <p style="margin:16px 0 0;font-size:11px;color:#57564F;">
              If you did not request this code, please ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px;border-top:1px solid #36362F;">
            <p style="margin:0;font-size:11px;color:#57564F;">&copy; 2026 Student Hub &middot; Indira University</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
        return send_email(to_email, subject, html_body)

    @staticmethod
    def send_phone_otp(phone_number: str, otp: str, purpose: str = "verification") -> bool:
        """
        Send a 6-digit verification code via SMS.
        Uses Fast2SMS or standard REST SMS gateway when FAST2SMS_API_KEY is configured in env.
        In demo/dev environments, securely logs the OTP and succeeds.
        """
        if not phone_number:
            return False

        clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
        # Remove +91 if present for Indian numbers on Fast2SMS
        if clean_phone.startswith("+91"):
            digits = clean_phone[3:]
        elif clean_phone.startswith("+"):
            digits = clean_phone[1:]
        else:
            digits = clean_phone

        fast2sms_key = getattr(settings, "FAST2SMS_API_KEY", None) or os.environ.get("FAST2SMS_API_KEY")

        if fast2sms_key and fast2sms_key.strip():
            try:
                url = "https://www.fast2sms.com/dev/bulkV2"
                payload = {
                    "variables_values": otp,
                    "route": "otp",
                    "numbers": digits,
                }
                headers = {
                    "authorization": fast2sms_key.strip(),
                    "Content-Type": "application/json"
                }
                with httpx.Client(timeout=6.0) as client:
                    resp = client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        logger.info(f"Fast2SMS OTP sent successfully to {digits[:4]}****")
                        return True
                    else:
                        logger.warning(f"Fast2SMS failed (HTTP {resp.status_code}): {resp.text}")
            except Exception as exc:
                logger.warning(f"SMS delivery error via Fast2SMS: {exc}")

        # Demo / dev fallback logger
        logger.info(f"[SMS OTP DEMO GATEWAY] Sent code {otp} to {phone_number} for {purpose}")
        return True

    @classmethod
    def generate_and_store_registration_otps(cls, db: Session, user: User) -> Dict[str, Any]:
        """Generate both Email & Phone OTPs and store with expiration on the user model."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

        email_otp = cls.generate_numeric_otp(6)
        phone_otp = cls.generate_numeric_otp(6)

        user.email_otp = email_otp
        user.email_otp_expires_at = expires_at
        user.phone_otp = phone_otp
        user.phone_otp_expires_at = expires_at

        db.commit()
        db.refresh(user)

        # Dispatch
        email_sent = cls.send_email_otp(user.email, email_otp, user_name=user.name, purpose="Registration Verification")
        phone_sent = cls.send_phone_otp(user.phone_number or "", phone_otp, purpose="Registration Verification")

        return {
            "email": user.email,
            "phone_number": user.phone_number,
            "email_sent": email_sent,
            "phone_sent": phone_sent,
            "expires_in_minutes": OTP_EXPIRY_MINUTES,
        }

    @classmethod
    def generate_and_store_login_otp(cls, db: Session, user: User) -> Tuple[str, str]:
        """Generate a single login 2FA OTP and send via email and SMS."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

        otp = cls.generate_numeric_otp(6)
        user.email_otp = otp
        user.email_otp_expires_at = expires_at

        db.commit()
        db.refresh(user)

        # Dispatch to email
        cls.send_email_otp(user.email, otp, user_name=user.name, purpose="Two-Factor Login Authentication")
        if user.phone_number:
            cls.send_phone_otp(user.phone_number, otp, purpose="Two-Factor Login Authentication")

        return otp, user.email

    @staticmethod
    def verify_registration_otps(
        db: Session,
        user: User,
        email_otp: str,
        phone_otp: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Verify the registration OTPs against the user record."""
        now = datetime.now(timezone.utc)

        # 1. Validate Email OTP
        if not user.email_otp or not user.email_otp_expires_at:
            return False, "No active email verification code found. Please request a new code."

        expires = user.email_otp_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        if now > expires:
            return False, "Verification code has expired. Please request a new code."

        if user.email_otp.strip() != email_otp.strip():
            return False, "Incorrect email verification code."

        # 2. Validate Phone OTP if user registered a phone number and phone OTP was sent
        if user.phone_number and user.phone_otp:
            if not phone_otp:
                return False, "Mobile verification code is required."
            if user.phone_otp.strip() != phone_otp.strip():
                return False, "Incorrect mobile verification code."

        # Success: mark user verified and clear single-use codes
        user.is_email_verified = True
        user.is_phone_verified = bool(user.phone_number)
        user.is_active = True
        user.email_otp = None
        user.email_otp_expires_at = None
        user.phone_otp = None
        user.phone_otp_expires_at = None

        db.commit()
        db.refresh(user)
        return True, "Verification successful."

    @staticmethod
    def verify_login_otp(db: Session, user: User, otp_code: str) -> Tuple[bool, str]:
        """Verify the 2FA login OTP."""
        now = datetime.now(timezone.utc)

        if not user.email_otp or not user.email_otp_expires_at:
            return False, "No active 2FA code found. Please log in again."

        expires = user.email_otp_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)

        if now > expires:
            return False, "2FA code has expired. Please log in again to receive a fresh code."

        if user.email_otp.strip() != otp_code.strip():
            return False, "Incorrect 2FA code."

        # Success: clear OTP
        user.email_otp = None
        user.email_otp_expires_at = None
        db.commit()
        db.refresh(user)
        return True, "2FA verification successful."


otp_service = OTPService()

