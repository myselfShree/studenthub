"""
Email service using Python's built-in smtplib.

Required Environment Variables on Render / Production:
- SMTP_HOST: default "smtp.gmail.com"
- SMTP_PORT: default 587 (or 465 for SSL)
- SMTP_USER: your full Gmail or SMTP address, e.g. shreeyadwad@gmail.com
- SMTP_PASSWORD: Gmail 16-character App Password (without spaces)
- EMAIL_FROM_NAME: default "Student Hub"
- FRONTEND_URL: e.g. "https://studenthub-amber.vercel.app"
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def clean_smtp_credentials() -> tuple[Optional[str], Optional[str]]:
    """Clean and return (user, password) stripping spaces and quotes."""
    user = (settings.SMTP_USER or "").strip().strip("'\"")
    password = (settings.SMTP_PASSWORD or "").strip().replace(" ", "").strip("'\"")
    return (user if user else None, password if password else None)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an email via SMTP.
    Returns True on successful delivery, False on failure.
    """
    smtp_user, smtp_password = clean_smtp_credentials()

    if not smtp_user or not smtp_password:
        logger.warning(
            "SMTP credentials not configured (SMTP_USER or SMTP_PASSWORD is missing). "
            "Password reset email to %s was not sent. "
            "To enable live emails, set SMTP_USER (e.g. shreeyadwad@gmail.com) and "
            "SMTP_PASSWORD (Gmail 16-digit App Password) in your Render environment variables.",
            to_email,
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        sender_name = settings.EMAIL_FROM_NAME or "Student Hub"
        msg["From"] = f"{sender_name} <{smtp_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        port = int(settings.SMTP_PORT)

        if port == 465:
            # SSL
            with smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=12) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())
        else:
            # STARTTLS (e.g. 587)
            with smtplib.SMTP(settings.SMTP_HOST, port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_user, [to_email], msg.as_string())

        logger.info("Successfully sent email to %s (subject: %s)", to_email, subject)
        return True

    except smtplib.SMTPAuthenticationError as exc:
        logger.error(
            "SMTP Authentication failed for %s. Ensure 2-Step Verification is active on Google "
            "and a dedicated App Password (not your account password) is set: %s",
            smtp_user, exc,
        )
        return False
    except Exception as exc:
        logger.error("Failed to send email to %s via SMTP (%s:%s): %s", to_email, settings.SMTP_HOST, settings.SMTP_PORT, exc)
        return False


def send_password_reset_email(to_email: str, reset_link: str, user_name: str = "there") -> bool:
    """Send a password-reset email with a time-limited link."""
    subject = "Reset your Student Hub password"
    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#11120D;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#1C1C17;border-radius:12px;border:1px solid #36362F;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #36362F;">
            <span style="font-size:20px;font-weight:700;color:#FFFBF4;letter-spacing:-0.02em;">Student Hub</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 12px;font-size:22px;font-weight:600;color:#FFFBF4;">Reset your password</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#D8CFBC;">
              Hi {user_name}, we received a request to reset your password.
              Click the button below to choose a new password. This link expires in <strong style="color:#FFFBF4;">30 minutes</strong>.
            </p>
            <a href="{reset_link}"
               style="display:inline-block;padding:12px 28px;background:#FFFBF4;color:#11120D;
                      font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
              Reset Password
            </a>
            <p style="margin:24px 0 0;font-size:12px;color:#8D8777;line-height:1.5;">
              Or copy and paste this link into your browser:<br/>
              <a href="{reset_link}" style="color:#8E9B7A;word-break:break-all;">{reset_link}</a>
            </p>
            <p style="margin:20px 0 0;font-size:12px;color:#57564F;">
              If you did not make this request, you can safely ignore this email — your account remains secure.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #36362F;">
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
