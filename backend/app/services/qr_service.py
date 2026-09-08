import io
import qrcode
import base64
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer

class QRService:
    @staticmethod
    def generate_qr_png_bytes(data: str) -> bytes:
        """
        Generates a PNG image of a QR code encoding the provided data/URL.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_qr_base64_data_uri(data: str) -> str:
        """
        Generates a data:image/png;base64,... string suitable for inline HTML/React <img> tags.
        """
        png_bytes = QRService.generate_qr_png_bytes(data)
        encoded = base64.b64encode(png_bytes).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

qr_service = QRService()
