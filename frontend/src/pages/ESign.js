import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Upload, 
  Download, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  PenTool,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Shield,
  AlertCircle,
  Move
} from 'lucide-react';
import axios from 'axios';

// Set the base URL for axios to point to the backend server
axios.defaults.baseURL = 'http://localhost:8080';

const ESign = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureSize, setSignatureSize] = useState({ width: 200, height: 100 });
  const [currentStep, setCurrentStep] = useState('upload'); // upload, sign, review, complete
  const [documentName, setDocumentName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [signatureThickness, setSignatureThickness] = useState(2);
  const [signatureText, setSignatureText] = useState('');
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'type'
  const [showQuickSignatureModal, setShowQuickSignatureModal] = useState(false);
  const [documentToSign, setDocumentToSign] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 0.7, y: 0.1, width: 0.25, height: 0.15 });
  const [availablePositions, setAvailablePositions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPdf, setPreviewPdf] = useState('');
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingDocuments: 0,
    signedDocuments: 0,
    expiredDocuments: 0
  });
  const [showVisualSignature, setShowVisualSignature] = useState(false);
  const [visualSignatureHtml, setVisualSignatureHtml] = useState('');
  const [showInlineEditor, setShowInlineEditor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pdfViewerRef, setPdfViewerRef] = useState(null);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
    fetchSignaturePositions();
  }, []);

  const fetchSignaturePositions = async () => {
    try {
      const response = await axios.get('/v1/esign/signature-positions');
      setAvailablePositions(response.data.data || []);
    } catch (error) {
      console.error('Failed to load signature positions:', error);
    }
  };

  const createSignaturePreview = async () => {
    if (!signature || !selectedDocument) {
      toast.error('Please create a signature first');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/v1/esign/preview-signature', {
        documentId: selectedDocument._id,
        signature: signature,
        position: signaturePosition
      });
      
      setPreviewPdf(response.data.data.previewPdf);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to create preview');
    } finally {
      setLoading(false);
    }
  };

  const createVisualSignature = async () => {
    if (!signature) {
      toast.error('Please create a signature first');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/v1/esign/visual-signature', {
        signature: signature,
        position: signaturePosition,
        metadata: {
          signerName: `${user?.first_name} ${user?.last_name}`,
          signerEmail: user?.email,
          signedAt: new Date().toISOString()
        }
      });
      
      // Create a visual overlay
      const overlayHtml = response.data.data.html;
      
      // Show the visual signature overlay
      setShowVisualSignature(true);
      setVisualSignatureHtml(overlayHtml);
    } catch (error) {
      console.error('Visual signature error:', error);
      toast.error('Failed to create visual signature');
    } finally {
      setLoading(false);
    }
  };

  const openInlineEditor = () => {
    if (!signature || !selectedDocument) {
      toast.error('Please create a signature first');
      return;
    }
    setShowInlineEditor(true);
  };

  // Initialize canvas when component mounts or when signature color/thickness changes
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 200;
      
      // Set initial drawing style
      ctx.strokeStyle = signatureColor;
      ctx.lineWidth = signatureThickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [signatureColor, signatureThickness]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/v1/esign/documents');
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/v1/esign/stats');
      setStats(response.data.data || {
        totalDocuments: 0,
        pendingDocuments: 0,
        signedDocuments: 0,
        expiredDocuments: 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB');
      return;
    }

    if (!file.type.includes('pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', file.name);

      const response = await axios.post('/v1/esign/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const newDocument = response.data.data;
      setDocuments(prev => [newDocument, ...prev]);
      setSelectedDocument(newDocument);
      setCurrentStep('sign');
      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureStart = () => {
    setIsDrawing(true);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    if (signatureMode === 'draw' && !signature) {
      toast.error('Please draw your signature first');
      return;
    }
    if (signatureMode === 'type' && !signatureText.trim()) {
      toast.error('Please enter your signature text');
      return;
    }
    
    if (signatureMode === 'type') {
      // Create a canvas with the typed signature
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 100;
      
      // Set background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set text style
      ctx.fillStyle = signatureColor;
      ctx.font = `bold 48px cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw text
      ctx.fillText(signatureText, canvas.width / 2, canvas.height / 2);
      
      // Convert to data URL
      const dataURL = canvas.toDataURL('image/png');
      setSignature(dataURL);
    }
    
    setIsDrawing(false);
    setShowSignatureModal(false);
    setCurrentStep('review');
  };

  const handleSignatureClear = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature('');
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragOffset({
      x: x - (signaturePosition.x * rect.width),
      y: y - (signaturePosition.y * rect.height)
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x) / rect.width;
    const y = (e.clientY - rect.top - dragOffset.y) / rect.height;
    
    // Constrain to PDF bounds
    const constrainedX = Math.max(0, Math.min(1 - signaturePosition.width, x));
    const constrainedY = Math.max(0, Math.min(1 - signaturePosition.height, y));
    
    setSignaturePosition(prev => ({
      ...prev,
      x: constrainedX,
      y: constrainedY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSignatureDragStart = () => {
    setIsDragging(true);
  };

  const handleSignatureDragEnd = () => {
    setIsDragging(false);
  };

  // Canvas drawing functions
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);
    
    isDrawingRef.current = true;
    lastPointRef.current = pos;
    
    // Set drawing style
    ctx.strokeStyle = signatureColor;
    ctx.lineWidth = signatureThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Start new path
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);
    
    // Draw line to current position
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastPointRef.current = pos;
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;
    
    isDrawingRef.current = false;
    
    // Save signature as data URL
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      setSignature(dataURL);
    }
  };

  const handleCanvasMouseLeave = () => {
    handleCanvasMouseUp();
  };

  const applySignatureToPosition = async () => {
    try {
      setLoading(true);
      
      // Convert position object to string for backend
      const positionString = 'custom';
      
      const response = await axios.post(`/v1/esign/sign/${selectedDocument._id}`, {
        signature: signature,
        signatureData: {
          mode: signatureMode,
          color: signatureColor,
          thickness: signatureThickness,
          text: signatureText
        },
        position: positionString,
        customPosition: signaturePosition
      });
      
      const updatedDocument = response.data.data;
      setDocuments(prev => 
        prev.map(doc => 
          doc._id === selectedDocument._id ? updatedDocument : doc
        )
      );
      
      toast.success('Document signed successfully!');
      fetchStats();
      setShowInlineEditor(false);
    } catch (error) {
      console.error('Sign error:', error);
      toast.error(error.response?.data?.message || 'Failed to sign document');
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  const handleSendForSignature = async () => {
    if (!recipientEmail || !documentName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/v1/esign/send', {
        documentId: selectedDocument._id,
        recipientEmail,
        message
      });
      
      const updatedDocument = response.data.data;
      setDocuments(prev => 
        prev.map(doc => 
          doc._id === selectedDocument._id ? updatedDocument : doc
        )
      );
      
      setCurrentStep('complete');
      toast.success('Document sent for signature successfully!');
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send document for signature');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      const response = await axios.get(`/v1/esign/download/${documentId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/v1/esign/document/${documentId}`);
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      toast.success('Document deleted successfully!');
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleSignDocument = async (documentId) => {
    if (!signature) {
      // Show signature creation modal
      setDocumentToSign(documentId);
      setShowQuickSignatureModal(true);
      return;
    }

    await performSignDocument(documentId);
  };

  const performSignDocument = async (documentId) => {
    setLoading(true);
    try {
      const response = await axios.post(`/v1/esign/sign/${documentId}`, {
        signature: signature,
        signatureData: {
          mode: signatureMode,
          color: signatureColor,
          thickness: signatureThickness,
          text: signatureText
        },
        position: signaturePosition
      });
      
      const updatedDocument = response.data.data;
      setDocuments(prev => 
        prev.map(doc => 
          doc._id === documentId ? updatedDocument : doc
        )
      );
      
      toast.success('Document signed successfully!');
      fetchStats(); // Refresh stats
      setShowQuickSignatureModal(false);
      setDocumentToSign(null);
    } catch (error) {
      console.error('Sign error:', error);
      toast.error(error.response?.data?.message || 'Failed to sign document');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Digital Signatures</h1>
        <p className="text-base text-gray-600">
          Sign and send documents securely with eSign
        </p>
      </div>

      {/* Statistics Card */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            <p className="text-sm text-gray-600">Total Documents</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingDocuments}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.signedDocuments}</p>
            <p className="text-sm text-gray-600">Signed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.expiredDocuments}</p>
            <p className="text-sm text-gray-600">Expired</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          {['upload', 'sign', 'review', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep === step 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : index < ['upload', 'sign', 'review', 'complete'].indexOf(currentStep)
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-500'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < ['upload', 'sign', 'review', 'complete'].indexOf(currentStep)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 capitalize">
            Step {['upload', 'sign', 'review', 'complete'].indexOf(currentStep) + 1}: {currentStep}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      {currentStep === 'upload' && (
        <div className="premium-card p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Document</h3>
            <p className="text-gray-600 mb-6">Upload a PDF document to sign electronically</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors duration-200">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Choose PDF File</span>
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-2">Maximum file size: 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Section */}
      {currentStep === 'sign' && (
        <div className="premium-card p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Signature</h3>
            <p className="text-gray-600">Draw your signature below or type it</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Drawing Canvas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Create Signature</h4>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSignatureMode('draw')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      signatureMode === 'draw' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Draw
                  </button>
                  <button
                    onClick={() => setSignatureMode('type')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      signatureMode === 'type' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Type
                  </button>
                </div>
              </div>

              {signatureMode === 'draw' ? (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Draw Signature</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={signatureColor}
                        onChange={(e) => setSignatureColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                      <select
                        value={signatureThickness}
                        onChange={(e) => setSignatureThickness(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={1}>Thin</option>
                        <option value={2}>Normal</option>
                        <option value={4}>Thick</option>
                      </select>
                    </div>
                  </div>
                  
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="border border-gray-300 rounded cursor-crosshair bg-white w-full h-[200px]"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ touchAction: 'none' }}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={handleSignatureClear}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear</span>
                    </button>
                    
                    <button
                      onClick={handleSignatureComplete}
                      disabled={!signature}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Use Signature</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Type Signature</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={signatureColor}
                        onChange={(e) => setSignatureColor(e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300"
                      />
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    placeholder="Enter your signature"
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl font-bold"
                    style={{ color: signatureColor }}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setSignatureText('')}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear</span>
                    </button>
                    
                    <button
                      onClick={handleSignatureComplete}
                      disabled={!signatureText.trim()}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Use Signature</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Signature Preview</h4>
              
              {/* Position Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature Position
                </label>
                <select
                  value={signaturePosition}
                  onChange={(e) => setSignaturePosition(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  {availablePositions.map((position) => (
                    <option key={position} value={position}>
                      {position.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[200px] flex items-center justify-center">
                {signature ? (
                  <img src={signature} alt="Signature" className="max-w-full max-h-full" />
                ) : (
                  <p className="text-gray-500 text-center">Your signature will appear here</p>
                )}
              </div>
              
              {/* Preview Button */}
              {signature && selectedDocument && (
                <div className="space-y-2">
                  <button
                    onClick={createSignaturePreview}
                    disabled={loading}
                    className="btn-secondary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Creating Preview...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Preview on Document</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={createVisualSignature}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Overlay...</span>
                      </>
                    ) : (
                      <>
                        <PenTool className="h-4 w-4" />
                        <span>Show Visual Overlay</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={openInlineEditor}
                    disabled={loading}
                    className="btn-secondary w-full flex items-center justify-center space-x-2"
                  >
                    <Move className="h-4 w-4" />
                    <span>Drag & Drop Editor</span>
                  </button>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900">Secure & Legal</h5>
                    <p className="text-sm text-blue-700">
                      Your digital signature is legally binding and secure. All signatures are encrypted and stored safely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Section */}
      {currentStep === 'review' && (
        <div className="premium-card p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Review & Send</h3>
            <p className="text-gray-600">Review your document and add recipient details</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="input-field"
                  placeholder="Enter document name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter recipient's email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Document Preview</h4>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedDocument?.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedDocument?.fileSize || 0)}</p>
                  </div>
                </div>
                
                {signature && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600 mb-2">Your Signature:</p>
                    <img src={signature} alt="Signature" className="max-w-full max-h-20" />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleSendForSignature}
                disabled={loading || !recipientEmail || !documentName}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send for Signature</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Section */}
      {currentStep === 'complete' && (
        <div className="premium-card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Document Sent Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your document has been sent for signature. The recipient will receive an email notification.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setCurrentStep('upload')}
              className="btn-primary"
            >
              Send Another Document
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              View All Documents
            </button>
          </div>
        </div>
      )}

      {/* Document History */}
      <div className="premium-card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Document History</h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-1">No documents found</p>
            <p className="text-gray-400 text-xs">Your document history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    document.status === 'signed' ? 'bg-green-100' : 
                    document.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {getStatusIcon(document.status)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{document.name}</p>
                    <p className="text-gray-500 text-xs">{document.recipientEmail || 'No recipient'}</p>
                    <p className="text-gray-400 text-xs">
                      Uploaded: {formatDate(document.uploadedAt)}
                      {document.signedAt && ` • Signed: ${formatDate(document.signedAt)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)} capitalize`}>
                    {document.status}
                  </span>
                  <button 
                    onClick={() => handleDownloadDocument(document._id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {document.status === 'pending' && (
                    <button 
                      onClick={() => handleSignDocument(document._id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {document.senderId === user?._id && (
                    <button 
                      onClick={() => handleDeleteDocument(document._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Signature Modal */}
      {showQuickSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Signature</h3>
              <button
                onClick={() => {
                  setShowQuickSignatureModal(false);
                  setDocumentToSign(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Drawing Canvas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Create Signature</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSignatureMode('draw')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        signatureMode === 'draw' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Draw
                    </button>
                    <button
                      onClick={() => setSignatureMode('type')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        signatureMode === 'type' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {signatureMode === 'draw' ? (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Draw Signature</h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={signatureColor}
                          onChange={(e) => setSignatureColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300"
                        />
                        <select
                          value={signatureThickness}
                          onChange={(e) => setSignatureThickness(Number(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value={1}>Thin</option>
                          <option value={2}>Normal</option>
                          <option value={4}>Thick</option>
                        </select>
                      </div>
                    </div>
                    
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={200}
                      className="border border-gray-300 rounded cursor-crosshair bg-white w-full h-[200px]"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseLeave}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{ touchAction: 'none' }}
                    />
                    
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={handleSignatureClear}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Type Signature</h4>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={signatureColor}
                          onChange={(e) => setSignatureColor(e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300"
                        />
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Enter your signature"
                      className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl font-bold"
                      style={{ color: signatureColor }}
                    />
                    
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => setSignatureText('')}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Signature Preview</h4>
                <div className="border border-gray-300 rounded-lg p-4 bg-white min-h-[200px] flex items-center justify-center">
                  {signature ? (
                    <img src={signature} alt="Signature" className="max-w-full max-h-full" />
                  ) : (
                    <p className="text-gray-500 text-center">Your signature will appear here</p>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-900">Secure & Legal</h5>
                      <p className="text-sm text-blue-700">
                        Your digital signature is legally binding and secure. All signatures are encrypted and stored safely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowQuickSignatureModal(false);
                  setDocumentToSign(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => performSignDocument(documentToSign)}
                disabled={loading || (signatureMode === 'draw' && !signature) || (signatureMode === 'type' && !signatureText.trim())}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Sign Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPreview && previewPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Document Preview with Signature</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <iframe
                src={previewPdf}
                className="w-full h-[600px]"
                title="PDF Preview"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowPreview(false)}
                className="btn-secondary"
              >
                Close Preview
              </button>
              <button
                onClick={handleSignatureComplete}
                disabled={!signature}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Use This Signature</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Signature Overlay Modal */}
      {showVisualSignature && visualSignatureHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Visual Signature Overlay</h3>
              <button
                onClick={() => setShowVisualSignature(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div dangerouslySetInnerHTML={{ __html: visualSignatureHtml }} />
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowVisualSignature(false)}
                className="btn-secondary"
              >
                Close Overlay
              </button>
              <button
                onClick={createVisualSignature}
                disabled={loading || !signature}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Applying Signature...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Apply Signature</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline PDF Editor Modal */}
      {showInlineEditor && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Drag & Drop Signature Editor</h3>
              <button
                onClick={() => setShowInlineEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="border border-gray-300 rounded-lg overflow-hidden relative">
                  <div className="bg-gray-100 p-4 border-b">
                    <h4 className="font-medium text-gray-900">PDF Document</h4>
                    <p className="text-sm text-gray-600">Drag the signature to your desired position</p>
                  </div>
                  
                  <div 
                    className="relative w-full h-[600px] bg-white"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    ref={setPdfViewerRef}
                  >
                    {/* PDF Placeholder */}
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">PDF Document: {selectedDocument.name}</p>
                        <p className="text-sm text-gray-500">Click and drag signature to position</p>
                      </div>
                    </div>
                    
                    {/* Draggable Signature */}
                    {signature && (
                      <div
                        className="absolute cursor-move border-2 border-blue-500 bg-white p-2 rounded shadow-lg"
                        style={{
                          left: `${signaturePosition.x * 100}%`,
                          top: `${signaturePosition.y * 100}%`,
                          width: `${signaturePosition.width * 100}%`,
                          height: `${signaturePosition.height * 100}%`,
                          zIndex: 1000
                        }}
                        onMouseDown={handleSignatureDragStart}
                        onMouseUp={handleSignatureDragEnd}
                      >
                        <img 
                          src={signature} 
                          alt="Signature" 
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Drag to move
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Signature Position</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        X Position: {Math.round(signaturePosition.x * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={signaturePosition.x * 100}
                        onChange={(e) => setSignaturePosition(prev => ({
                          ...prev,
                          x: e.target.value / 100
                        }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Y Position: {Math.round(signaturePosition.y * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={signaturePosition.y * 100}
                        onChange={(e) => setSignaturePosition(prev => ({
                          ...prev,
                          y: e.target.value / 100
                        }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width: {Math.round(signaturePosition.width * 100)}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={signaturePosition.width * 100}
                        onChange={(e) => setSignaturePosition(prev => ({
                          ...prev,
                          width: e.target.value / 100
                        }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height: {Math.round(signaturePosition.height * 100)}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={signaturePosition.height * 100}
                        onChange={(e) => setSignaturePosition(prev => ({
                          ...prev,
                          height: e.target.value / 100
                        }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Quick Positions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSignaturePosition({ x: 0.7, y: 0.1, width: 0.25, height: 0.15 })}
                      className="btn-secondary text-xs py-2"
                    >
                      Bottom Right
                    </button>
                    <button
                      onClick={() => setSignaturePosition({ x: 0.05, y: 0.1, width: 0.25, height: 0.15 })}
                      className="btn-secondary text-xs py-2"
                    >
                      Bottom Left
                    </button>
                    <button
                      onClick={() => setSignaturePosition({ x: 0.35, y: 0.4, width: 0.3, height: 0.2 })}
                      className="btn-secondary text-xs py-2"
                    >
                      Center
                    </button>
                    <button
                      onClick={() => setSignaturePosition({ x: 0.05, y: 0.75, width: 0.25, height: 0.15 })}
                      className="btn-secondary text-xs py-2"
                    >
                      Top Left
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowInlineEditor(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applySignatureToPosition}
                    disabled={loading || !signature}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Signing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Apply Signature</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESign; 