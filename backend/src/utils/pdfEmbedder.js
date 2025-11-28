const fs = require('fs-extra');
const path = require('path');
const { PDFDocument, PDFImage, rgb } = require('pdf-lib');
const sharp = require('sharp');

class PDFEmbedder {
  constructor() {
    this.signaturePositions = {
      bottomRight: { x: 0.7, y: 0.1, width: 0.25, height: 0.15 },
      bottomLeft: { x: 0.05, y: 0.1, width: 0.25, height: 0.15 },
      center: { x: 0.35, y: 0.4, width: 0.3, height: 0.2 }
    };
  }

  /**
   * Embed signature into PDF using pdf-lib
   */
  async embedSignature(pdfPath, signatureData, options = {}) {
    try {
      const signedPdfPath = this.generateSignedPdfPath(pdfPath);
      
      // Read the original PDF
      const pdfBytes = await fs.readFile(pdfPath);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get the first page (or specified page)
      const pages = pdfDoc.getPages();
      const page = pages[options.pageIndex || 0];
      
      // Process signature image
      const signatureImage = await this.processSignatureImage(signatureData);
      
      // Embed signature on the page
      await this.embedImageOnPage(page, signatureImage, options);
      
      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      await fs.writeFile(signedPdfPath, signedPdfBytes);
      
      return {
        success: true,
        signedPdfPath,
        originalPdfPath: pdfPath
      };
    } catch (error) {
      console.error('Error embedding signature:', error);
      throw new Error('Failed to embed signature into PDF');
    }
  }

  /**
   * Process signature image from base64 using sharp
   */
  async processSignatureImage(signatureData) {
    try {
      // Remove data URL prefix if present
      let base64Data = signatureData;
      if (signatureData.startsWith('data:image/')) {
        base64Data = signatureData.split(',')[1];
      }
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Process image with sharp (resize, optimize)
      const processedImage = await sharp(imageBuffer)
        .resize(300, 150, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      
      return {
        buffer: processedImage,
        format: 'png',
        size: processedImage.length,
        base64: base64Data
      };
    } catch (error) {
      console.error('Error processing signature image:', error);
      throw new Error('Failed to process signature image');
    }
  }

  /**
   * Embed image on PDF page using pdf-lib
   */
  async embedImageOnPage(page, signatureImage, options = {}) {
    try {
      const { width, height } = page.getSize();
      
      // Get position and size
      let pos;
      if (options.customPosition) {
        // Use custom position from inline editor
        pos = options.customPosition;
      } else {
        // Use preset position
        const position = options.position || 'bottomRight';
        pos = this.signaturePositions[position];
      }
      
      // Calculate actual coordinates
      const x = pos.x * width;
      const y = pos.y * height;
      const imgWidth = pos.width * width;
      const imgHeight = pos.height * height;
      
      // Embed the image using pdf-lib
      const image = await page.doc.embedPng(signatureImage.buffer);
      
      // Draw the image on the page
      page.drawImage(image, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
      });
      
      // Add signature metadata as text
      if (options.metadata) {
        const fontSize = 8;
        const textY = y - fontSize - 5;
        
        page.drawText(`Signed by: ${options.metadata.signerName || 'Unknown'}`, {
          x: x + 5,
          y: textY,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
          x: x + 5,
          y: textY - fontSize - 2,
          size: fontSize,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
    } catch (error) {
      console.error('Error embedding image on page:', error);
      throw new Error('Failed to embed image on PDF page');
    }
  }

  /**
   * Embed text into PDF using pdf-lib
   */
  async embedText(pdfPath, textData, options = {}) {
    try {
      const signedPdfPath = this.generateSignedPdfPath(pdfPath);
      
      // Read the original PDF
      const pdfBytes = await fs.readFile(pdfPath);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get the first page (or specified page)
      const pages = pdfDoc.getPages();
      const page = pages[options.pageIndex || 0];
      
      // Embed text on the page
      await this.embedTextOnPage(page, textData, options);
      
      // Save the annotated PDF
      const signedPdfBytes = await pdfDoc.save();
      await fs.writeFile(signedPdfPath, signedPdfBytes);
      
      return {
        success: true,
        signedPdfPath,
        originalPdfPath: pdfPath
      };
    } catch (error) {
      console.error('Error embedding text:', error);
      throw new Error('Failed to embed text into PDF');
    }
  }

  /**
   * Embed text on PDF page using pdf-lib
   */
  async embedTextOnPage(page, textData, options = {}) {
    try {
      const { width, height } = page.getSize();
      
      // Get position
      const position = options.position || 'bottomRight';
      const pos = this.signaturePositions[position];
      
      // Calculate actual coordinates
      const x = pos.x * width;
      const y = pos.y * height;
      
      // Text styling
      const fontSize = options.fontSize || 12;
      const color = options.color || rgb(0, 0, 0);
      
      // Draw text
      page.drawText(textData.text, {
        x: x + 5,
        y: y + 5,
        size: fontSize,
        color: color,
      });
      
      // Add border if requested
      if (options.addBorder) {
        page.drawRectangle({
          x: x,
          y: y,
          width: pos.width * width,
          height: pos.height * height,
          borderWidth: 1,
          borderColor: rgb(0.7, 0.7, 0.7),
        });
      }
      
    } catch (error) {
      console.error('Error embedding text on page:', error);
      throw new Error('Failed to embed text on PDF page');
    }
  }

  /**
   * Create a visual signature overlay (HTML approach)
   */
  createVisualSignatureOverlay(signatureData, options = {}) {
    const position = options.position || 'bottomRight';
    const pos = this.signaturePositions[position];
    
    // Create HTML overlay with signature
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .signature-overlay {
            position: absolute;
            left: ${pos.x * 100}%;
            bottom: ${pos.y * 100}%;
            width: ${pos.width * 100}%;
            height: ${pos.height * 100}%;
            z-index: 1000;
          }
          .signature-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .signature-info {
            position: absolute;
            bottom: -20px;
            left: 0;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="signature-overlay">
          <img src="data:image/png;base64,${signatureData}" class="signature-image" />
          <div class="signature-info">
            Signed by: ${options.metadata?.signerName || 'Unknown'} | 
            Date: ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate signed PDF path
   */
  generateSignedPdfPath(originalPath) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const timestamp = Date.now();
    return path.join(dir, `${name}_signed_${timestamp}${ext}`);
  }

  /**
   * Get available signature positions
   */
  getSignaturePositions() {
    return Object.keys(this.signaturePositions);
  }

  /**
   * Validate PDF file using pdf-lib
   */
  async validatePDF(pdfPath) {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      return {
        isValid: true,
        size: pdfBytes.length,
        pageCount: pages.length
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Extract PDF metadata using pdf-lib
   */
  async extractPDFMetadata(pdfPath) {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      return {
        size: pdfBytes.length,
        pageCount: pages.length,
        title: pdfDoc.getTitle() || 'Untitled',
        author: pdfDoc.getAuthor() || 'Unknown',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || []
      };
    } catch (error) {
      console.error('Error extracting PDF metadata:', error);
      throw new Error('Failed to extract PDF metadata');
    }
  }

  /**
   * Check if PDF is signed by looking for embedded images
   */
  async isSigned(pdfPath) {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Check if any page has images (potential signatures)
      for (const page of pages) {
        const operators = page.node.Resources()?.XObject()?.asMap();
        if (operators && Object.keys(operators).length > 0) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if PDF is signed:', error);
      return false;
    }
  }
}

module.exports = PDFEmbedder; 
