"""
Email service — uses Brevo (formerly Sendinblue) HTTPS API.

WHY BREVO?
- Render free tier BLOCKS outbound SMTP (ports 587/465) → can't use Gmail SMTP
- Resend requires a verified domain to send to other users
- Brevo only requires verifying your sender Gmail address — no domain needed
- Free tier: 300 emails/day, 9,000/month

Setup (5 minutes):
1. Sign up free at https://app.brevo.com (no credit card)
2. Go to Settings → Senders & IP → Add Sender → add your Gmail → verify it
3. Go to SMTP & API → API Keys → Create Key → copy it
4. On Render: add BREVO_API_KEY = <your_key>
5. On Render: add BREVO_SENDER_EMAIL = shreeyadwad@gmail.com
6. On Render: add BREVO_SENDER_NAME = Student Hub
"""
import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an email via Brevo HTTPS API (works on Render free tier).
    No domain verification needed — just verify your sender Gmail address on Brevo.
    Returns True on success, False on failure.
    """
    brevo_key = (getattr(settings, "BREVO_API_KEY", None) or "").strip()

    if brevo_key:
        return _send_via_brevo(to_email, subject, html_body, brevo_key)

    # Fallback: try Resend if configured
    resend_key = (getattr(settings, "RESEND_API_KEY", None) or "").strip()
    if resend_key:
        return _send_via_resend(to_email, subject, html_body, resend_key)

    logger.warning(
        "No email service configured. Email to %s was NOT sent. "
        "Set BREVO_API_KEY on Render (free at https://app.brevo.com).",
        to_email,
    )
    return False


def _send_via_brevo(to_email: str, subject: str, html_body: str, api_key: str) -> bool:
    """Send email using Brevo HTTPS API. No domain needed — just verify sender email."""
    sender_email = (getattr(settings, "BREVO_SENDER_EMAIL", None) or "").strip()
    sender_name = (getattr(settings, "BREVO_SENDER_NAME", None) or "Student Hub").strip()

    if not sender_email:
        logger.error(
            "BREVO_SENDER_EMAIL is not set. Add it to Render env vars "
            "(e.g. shreeyadwad@gmail.com — must be verified in Brevo Senders)."
        )
        return False

    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                BREVO_API_URL,
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json=payload,
            )

        if resp.status_code in (200, 201):
            data = resp.json()
            logger.info("Brevo email sent to %s — messageId: %s", to_email, data.get("messageId", "unknown"))
            return True
        else:
            logger.error(
                "Brevo API returned HTTP %s for %s: %s",
                resp.status_code, to_email, resp.text,
            )
            return False

    except Exception as exc:
        logger.error("Brevo email delivery failed to %s: %s", to_email, exc)
        return False


def _send_via_resend(to_email: str, subject: str, html_body: str, api_key: str) -> bool:
    """Fallback: send via Resend (requires verified domain for non-owner emails)."""
    try:
        import resend
        resend.api_key = api_key
        from_email = (getattr(settings, "RESEND_FROM_EMAIL", None) or "Student Hub <onboarding@resend.dev>").strip()
        params: resend.Emails.SendParams = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
        email = resend.Emails.send(params)
        logger.info("Resend email sent to %s — id: %s", to_email, email.get("id", "unknown"))
        return True
    except Exception as exc:
        logger.error("Resend email delivery failed to %s: %s", to_email, exc)
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
