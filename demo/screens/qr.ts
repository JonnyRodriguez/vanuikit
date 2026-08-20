/**
 * Referencia — wrapper de qr-code-styling: genera el QR como data-URI SVG.
 * Instancia por uso para evitar carreras entre generate() concurrentes.
 *
 * Internamente usa any porque los tipos de qr-code-styling son poco fiables;
 * la API pública (generate) sí está tipada.
 */
import QRCodeStyling from "qr-code-styling";

type QRResult = { qr: string } | { error: unknown };

export class QRGenerator {
  private config: Record<string, any>;
  private qrCode: any = null;

  constructor(options: Record<string, any> = {}) {
    this.config = {
      width: 150,
      height: 150,
      type: "svg",
      imageOptions: {
        imageSize: 0.8,
        margin: 5,
      },
      dotsOptions: {
        color: "#000",
        type: "rounded",
      },
      backgroundOptions: {
        color: "#fff",
      },
      ...options,
    };
  }

  async generate(text: string, image?: string): Promise<QRResult> {
    if (!this.qrCode) {
      this.config.data = text;
      this.config.image = image;
      this.qrCode = new QRCodeStyling(this.config);
    } else {
      this.qrCode.update({ data: text, image });
    }

    try {
      const blob = await this.qrCode.getRawData("svg");
      if (!blob) return { error: new Error("QR vacío") };
      const svgText = await blob.text();
      return {
        qr: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText),
      };
    } catch (err) {
      console.error("Error al generar QR:", err);
      return { error: err };
    }
  }
}
