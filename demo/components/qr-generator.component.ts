// demo/components/qr-generator.component.ts
/**
 * QRGenerator Component — Wrapper de qrcode para generar QR como data-URI.
 */
import QRCode from "qrcode";

export type QRResult = { qr: string } | { error: unknown };

export class QRGenerator {
  private config: Record<string, any>;

  constructor(options: Record<string, any> = {}) {
    this.config = {
      width: 150,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      ...options,
    };
  }

  async generate(text: string, _image?: string): Promise<QRResult> {
    try {
      const qrDataUrl = await QRCode.toDataURL(text, this.config);
      return { qr: qrDataUrl };
    } catch (err) {
      console.error("Error al generar QR:", err);
      return { error: err };
    }
  }
}

