declare module 'pdf-lib' {
  export class PDFDocument {
    static load(data: Uint8Array | ArrayBuffer | string, options?: { updateMetadata?: boolean }): Promise<PDFDocument>;
    static create(): Promise<PDFDocument>;
    getPages(): PDFPage[];
    getPageCount(): number;
    addPage(page?: PDFPage): PDFPage;
    embedFont(font: StandardFonts | Uint8Array): Promise<PDFFont>;
    embedStandardFont(font: StandardFonts): PDFFont;
    save(options?: { useObjectStreams?: boolean; addDefaultPage?: boolean; preserveExistingEncryption?: boolean; password?: string; ownerPassword?: string; permissions?: number[] }): Promise<Uint8Array>;
    copyPages(srcDoc: PDFDocument, indices: number[]): Promise<PDFPage[]>;
    setTitle(title: string): void;
    setAuthor(author: string): void;
    setCreationDate(date: Date): void;
    setModificationDate(date: Date): void;
  }

  export class PDFPage {
    getSize(): { width: number; height: number };
    drawText(text: string, options?: {
      x?: number;
      y?: number;
      size?: number;
      font?: PDFFont;
      color?: { r: number; g: number; b: number };
      rotate?: { angle: number; type: 'degrees' };
    }): void;
    drawRectangle(options?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      borderWidth?: number;
      borderColor?: { r: number; g: number; b: number };
      color?: { r: number; g: number; b: number };
    }): void;
    drawImage(image: PDFImage, options?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }): void;
    embedImage(imageData: Uint8Array): Promise<PDFImage>;
  }

  export class PDFFont {
    widthOfTextAtSize(text: string, size: number): number;
    heightAtSize(size: number): number;
  }

  export class PDFImage {
    width: number;
    height: number;
  }

  export enum StandardFonts {
    Helvetica = 'Helvetica',
    HelveticaBold = 'Helvetica-Bold',
    HelveticaOblique = 'Helvetica-Oblique',
    HelveticaBoldOblique = 'Helvetica-BoldOblique',
    TimesRoman = 'Times-Roman',
    TimesRomanBold = 'Times-Bold',
    TimesRomanItalic = 'Times-Italic',
    TimesRomanBoldItalic = 'Times-BoldItalic',
    Courier = 'Courier',
    CourierBold = 'Courier-Bold',
    CourierOblique = 'Courier-Oblique',
    CourierBoldOblique = 'Courier-BoldOblique',
    Symbol = 'Symbol',
    ZapfDingbats = 'ZapfDingbats',
  }

  export function rgb(r: number, g: number, b: number): { r: number; g: number; b: number };
  export function degrees(angle: number): { angle: number; type: 'degrees' };
}
