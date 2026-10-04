"""
Email service using Python's built-in smtplib.
Set SMTP_USER and SMTP_PASSWORD in your environment.
For Gmail: use an App Password (myaccount.google.com -> Security -> App Passwords).
If SMTP credentials are not set, emails are printed to the logs (dev mode).
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Falls back to log output in dev when credentials missing."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP credentials not set — email not sent.\n"
            "  To: %s\n  Subject: %s\n  Body:\n%s",
            to_email, subject, html_body,
        )
        return True  # treat as success in dev

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info("Email sent to %s", to_email)
        return True

    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


def send_password_reset_email(to_email: str, reset_link: str, user_name: str = "there") -> bool:
    """Send a password-reset email with a time-limited link."""
    subject = "Reset your Student Hub password"
    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#11120D;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#1C1C17;border-radius:12px;border:1px solid #36362F;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #36362F;">
            <span style="font-size:20px;font-weight:700;color:#F0EDE6;">Student Hub</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 12px;font-size:22px;font-weight:600;color:#F0EDE6;">Reset your password</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#8D8777;">
              Hi {user_name}, click the button below to set a new password.
              This link expires in <strong style="color:#F0EDE6;">30 minutes</strong>.
            </p>
            <a href="{reset_link}"
               style="display:inline-block;padding:14px 32px;background:#8E9B7A;color:#11120D;
                      font-size:15px;font-weight:600;border-radius:8px;text-decoration:none;">
              Reset password
            </a>
            <p style="margin:24px 0 0;font-size:13px;color:#57564F;">
              Or paste this link in your browser:<br/>
              <a href="{reset_link}" style="color:#8E9B7A;">{reset_link}</a>
            </p>
            <p style="margin:16px 0 0;font-size:13px;color:#57564F;">
              If you did not request this, ignore this email — your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #36362F;">
            <p style="margin:0;font-size:12px;color:#57564F;">&copy; 2026 Student Hub</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    return send_email(to_email, subject, html_body)
