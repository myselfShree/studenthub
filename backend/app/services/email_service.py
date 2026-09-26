"""
Email service using Brevo (formerly Sendinblue) for transactional mail delivery.
Install: pip install sib-api-v3-sdk
If BREVO_API_KEY is not configured, emails are logged to stderr (dev mode).
"""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_brevo(to_email: str, subject: str, html_content: str) -> bool:
    """Send email through Brevo Transactional API. Returns True on success."""
    try:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException

        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = settings.BREVO_API_KEY

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            sender={"name": settings.EMAIL_FROM_NAME, "email": settings.EMAIL_FROM},
            to=[{"email": to_email}],
            subject=subject,
            html_content=html_content,
        )

        api_instance.send_transac_email(send_smtp_email)
        logger.info("Email sent to %s via Brevo", to_email)
        return True

    except Exception as exc:
        logger.error("Brevo send failed: %s", exc)
        return False


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email. Uses Brevo when BREVO_API_KEY is configured.
    In development (no key), logs the email body to stderr so devs can read the reset link.
    Returns True if the email was delivered (or simulated in dev).
    """
    if not settings.BREVO_API_KEY:
        # Dev fallback — print to logs so developers can read the link
        logger.warning(
            "BREVO_API_KEY not set — email not sent. Would have delivered:\n"
            "  To: %s\n  Subject: %s\n  Body:\n%s",
            to_email,
            subject,
            html_content,
        )
        return True  # Treat as success in dev so the endpoint still returns 200

    return _send_via_brevo(to_email, subject, html_content)


def send_password_reset_email(to_email: str, reset_link: str, user_name: str = "there") -> bool:
    """Send a single-use, time-limited password-reset email."""
    subject = "Reset your Student Hub password"
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#11120D;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#11120D;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#1C1C17;border-radius:12px;border:1px solid #36362F;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #36362F;">
              <span style="font-size:20px;font-weight:700;color:#F0EDE6;letter-spacing:-0.5px;">
                Student Hub
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 12px;font-size:22px;font-weight:600;color:#F0EDE6;">
                Reset your password
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#8D8777;">
                Hi {user_name}, we received a request to reset the password for your
                Student Hub account. Click the button below to choose a new password.
                This link expires in <strong style="color:#F0EDE6;">30 minutes</strong>.
              </p>
              <a href="{reset_link}"
                 style="display:inline-block;padding:14px 32px;background:#8E9B7A;color:#11120D;
                        font-size:15px;font-weight:600;border-radius:8px;text-decoration:none;">
                Reset password
              </a>
              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#57564F;">
                If the button doesn&rsquo;t work, copy and paste this link into your browser:<br/>
                <a href="{reset_link}" style="color:#8E9B7A;word-break:break-all;">{reset_link}</a>
              </p>
              <p style="margin:20px 0 0;font-size:13px;color:#57564F;">
                If you didn&rsquo;t request a password reset, you can safely ignore this email.
                Your password will not change.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #36362F;">
              <p style="margin:0;font-size:12px;color:#57564F;">
                &copy; 2026 Student Hub. This is an automated message &mdash; please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return send_email(to_email, subject, html_content)
