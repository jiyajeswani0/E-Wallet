const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const PDFEmbedder = require('../utils/pdfEmbedder');

const router = express.Router();
const pdfEmbedder = new PDFEmbedder();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Get all documents for a user
router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await Document.find({ 
      $or: [
        { senderId: req.customer._id },
        { recipientEmail: req.customer.email }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});

// Upload a new document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const document = new Document({
      name: req.body.name || req.file.originalname,
      filePath: req.file.path,
      fileName: req.file.filename,
      senderId: req.customer._id,
      senderName: `${req.customer.first_name} ${req.customer.last_name}`,
      senderEmail: req.customer.email,
      status: 'pending',
      fileSize: req.file.size,
      uploadedAt: new Date()
    });

    await document.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// Send document for signature
router.post('/send', auth, async (req, res) => {
  try {
    const { documentId, recipientEmail, message } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.senderId !== req.customer._id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send this document'
      });
    }

    document.recipientEmail = recipientEmail;
    document.message = message;
    document.status = 'sent';
    document.sentAt = new Date();
    document.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await document.save();

    // TODO: Send email notification to recipient
    // await sendSignatureEmail(recipientEmail, document);

    res.json({
      success: true,
      message: 'Document sent for signature successfully',
      data: document
    });
  } catch (error) {
    console.error('Error sending document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send document'
    });
  }
});

// Sign a document
router.post('/sign/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signature, signatureData, position = 'bottomRight', customPosition } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // if (document.recipientEmail !== req.customer.email) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You are not authorized to sign this document'
    //   });
    // }

    if (document.status !== 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Document is not available for signing'
      });
    }

    // Use custom position if provided, otherwise use preset position
    const signatureOptions = {
      position: position,
      metadata: {
        signerName: `${req.customer.first_name} ${req.customer.last_name}`,
        signerEmail: req.customer.email,
        signedAt: new Date()
      }
    };

    // If custom position is provided, use it
    if (customPosition && position === 'custom') {
      signatureOptions.customPosition = customPosition;
    }

    // Embed signature into PDF
    const signResult = await pdfEmbedder.embedSignature(document.filePath, signature, signatureOptions);

    // Save signature data and signed PDF path
    document.signature = signature;
    document.signatureData = signatureData;
    document.signedBy = req.customer._id;
    document.signerName = `${req.customer.first_name} ${req.customer.last_name}`;
    document.signedAt = new Date();
    document.status = 'signed';
    document.signedPdfPath = signResult.signedPdfPath;
    document.signaturePosition = position;
    
    // Save custom position if provided
    if (customPosition) {
      document.signatureCoordinates = customPosition;
    }

    await document.save();

    res.json({
      success: true,
      message: 'Document signed successfully',
      data: document
    });
  } catch (error) {
    console.error('Error signing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign document'
    });
  }
});

// Download signed document
router.get('/download/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document
    if (document.senderId !== req.customer._id && 
        document.recipientEmail !== req.customer.email) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download this document'
      });
    }

    // Determine which PDF to serve
    let pdfPath = document.filePath;
    let fileName = document.name;
    
    // If document is signed and signed PDF exists, serve the signed version
    if (document.status === 'signed' && document.signedPdfPath && fs.existsSync(document.signedPdfPath)) {
      pdfPath = document.signedPdfPath;
      fileName = document.name.replace('.pdf', '_signed.pdf');
    } else if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    res.download(pdfPath, fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
});

// Get document details
router.get('/document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document
    if (document.senderId !== req.customer._id && 
        document.recipientEmail !== req.customer.email) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this document'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document'
    });
  }
});

// Delete document
router.delete('/document/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.senderId !== req.customer._id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this document'
      });
    }

    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await Document.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

// Get document statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Document.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.customer._id },
            { recipientEmail: req.customer.email }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          pendingDocuments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          signedDocuments: {
            $sum: { $cond: [{ $eq: ['$status', 'signed'] }, 1, 0] }
          },
          expiredDocuments: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalDocuments: 0,
      pendingDocuments: 0,
      signedDocuments: 0,
      expiredDocuments: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document statistics'
    });
  }
});

// Get available signature positions
router.get('/signature-positions', auth, (req, res) => {
  try {
    const positions = pdfEmbedder.getSignaturePositions();
    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error getting signature positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get signature positions'
    });
  }
});

// Preview signature on document
router.post('/preview-signature', auth, async (req, res) => {
  try {
    const { documentId, signature, position = 'bottomRight' } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document
    if (document.senderId !== req.customer._id && 
        document.recipientEmail !== req.customer.email) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to preview this document'
      });
    }

    // Create preview PDF with signature
    const previewResult = await pdfEmbedder.embedSignature(document.filePath, signature, {
      position: position,
      metadata: {
        signerName: `${req.customer.first_name} ${req.customer.last_name}`,
        signerEmail: req.customer.email,
        signedAt: new Date()
      }
    });

    // Return preview PDF as base64
    const previewBuffer = fs.readFileSync(previewResult.signedPdfPath);
    const previewBase64 = previewBuffer.toString('base64');

    // Clean up preview file
    fs.unlinkSync(previewResult.signedPdfPath);

    res.json({
      success: true,
      data: {
        previewPdf: `data:application/pdf;base64,${previewBase64}`,
        position: position
      }
    });
  } catch (error) {
    console.error('Error creating signature preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create signature preview'
    });
  }
});

// Create visual signature overlay
router.post('/visual-signature', auth, async (req, res) => {
  try {
    const { signature, position = 'bottomRight', metadata = {} } = req.body;

    // Create visual signature overlay
    const visualOverlay = pdfEmbedder.createVisualSignatureOverlay(signature, {
      position: position,
      metadata: metadata
    });

    res.json({
      success: true,
      data: {
        html: visualOverlay,
        position: position,
        metadata: metadata
      }
    });
  } catch (error) {
    console.error('Error creating visual signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create visual signature'
    });
  }
});

// Check if PDF is signed
router.get('/check-signed/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document
    if (document.senderId !== req.customer._id && 
        document.recipientEmail !== req.customer.email) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this document'
      });
    }

    let isSigned = false;
    let pdfMetadata = null;

    if (document.signedPdfPath && fs.existsSync(document.signedPdfPath)) {
      isSigned = await pdfEmbedder.isSigned(document.signedPdfPath);
      if (isSigned) {
        pdfMetadata = await pdfEmbedder.extractPDFMetadata(document.signedPdfPath);
      }
    }

    res.json({
      success: true,
      data: {
        isSigned: isSigned,
        pdfMetadata: pdfMetadata,
        document: document
      }
    });
  } catch (error) {
    console.error('Error checking document signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check document signature'
    });
  }
});

// Get PDF metadata
router.get('/pdf-metadata/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document
    if (document.senderId !== req.customer._id && 
        document.recipientEmail !== req.customer.email) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this document'
      });
    }

    let metadata = null;
    let isValid = false;

    if (fs.existsSync(document.filePath)) {
      const validation = await pdfEmbedder.validatePDF(document.filePath);
      isValid = validation.isValid;
      
      if (isValid) {
        metadata = await pdfEmbedder.extractPDFMetadata(document.filePath);
      }
    }

    res.json({
      success: true,
      data: {
        isValid: isValid,
        metadata: metadata,
        document: document
      }
    });
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PDF metadata'
    });
  }
});

module.exports = router; 
