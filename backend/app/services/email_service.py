"""
Email service — uses Resend (HTTPS API) which works on Render free tier.

Render's free tier blocks outbound SMTP (ports 587/465), so we use Resend's
HTTP API instead. Resend is free up to 3,000 emails/month.

Required Environment Variables on Render:
- RESEND_API_KEY: Get from https://resend.com (free signup, no credit card)
- RESEND_FROM_EMAIL: Sender address, e.g. "Student Hub <onboarding@resend.dev>"
  (Use onboarding@resend.dev for testing, or a verified domain for production)

Optional fallback (only works locally, NOT on Render free tier):
- SMTP_USER, SMTP_PASSWORD for local development
"""
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an email via Resend HTTP API (works on Render free tier).
    Falls back to SMTP only in local dev if RESEND_API_KEY is not set.
    Returns True on success, False on failure.
    """
    resend_key = (getattr(settings, "RESEND_API_KEY", None) or "").strip()

    if resend_key:
        return _send_via_resend(to_email, subject, html_body, resend_key)
    else:
        logger.warning(
            "RESEND_API_KEY is not set. Trying SMTP fallback for %s. "
            "NOTE: SMTP does not work on Render free tier — set RESEND_API_KEY instead. "
            "Get a free key at https://resend.com",
            to_email,
        )
        return _send_via_smtp(to_email, subject, html_body)


def _send_via_resend(to_email: str, subject: str, html_body: str, api_key: str) -> bool:
    """Send email using Resend HTTPS API."""
    try:
        import resend
        resend.api_key = api_key

        from_email = (getattr(settings, "RESEND_FROM_EMAIL", None) or "").strip()
        if not from_email:
            # Default: use Resend's shared testing domain (works without domain verification)
            from_email = "Student Hub <onboarding@resend.dev>"

        params: resend.Emails.SendParams = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        email = resend.Emails.send(params)
        logger.info("Email sent via Resend to %s — id: %s", to_email, email.get("id", "unknown"))
        return True

    except Exception as exc:
        logger.error("Resend email delivery failed to %s: %s", to_email, exc)
        return False


def _send_via_smtp(to_email: str, subject: str, html_body: str) -> bool:
    """SMTP fallback for local development only. Does NOT work on Render free tier."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_user = (getattr(settings, "SMTP_USER", None) or "").strip().strip("'\"")
    smtp_password = (getattr(settings, "SMTP_PASSWORD", None) or "").strip().replace(" ", "").strip("'\"")

    if not smtp_user or not smtp_password:
        logger.warning(
            "No email credentials set. Email to %s was NOT sent. "
            "On Render: set RESEND_API_KEY. Locally: set SMTP_USER + SMTP_PASSWORD.",
            to_email,
        )
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME or 'Student Hub'} <{smtp_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
    attempts = [(587, False), (465, True)]
    last_error = None

    for port, use_ssl in attempts:
        try:
            if use_ssl:
                with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(host, port, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to_email], msg.as_string())
            logger.info("SMTP email sent to %s via port %s", to_email, port)
            return True
        except smtplib.SMTPAuthenticationError as exc:
            logger.error("SMTP auth failed for %s: %s", smtp_user, exc)
            return False
        except Exception as exc:
            last_error = exc
            continue

    logger.error("All SMTP attempts failed for %s: %s", to_email, last_error)
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
              If you did not make this request, you can safely ignore this email.
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
