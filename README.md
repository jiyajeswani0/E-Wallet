# 🏦 Digital Wallet & eSign Platform

A comprehensive digital wallet application with integrated eSign capabilities, built with React, Node.js, Express, and MongoDB. Features secure digital payments, money transfers, and Adobe Acrobat-like document signing functionality.

## ✨ Features

### 💳 **Digital Wallet**
- **Secure Authentication**: JWT-based user authentication
- **Balance Management**: Real-time balance tracking
- **Money Transfers**: Send money to other users
- **Transaction History**: Complete transaction logs with filtering
- **Razorpay Integration**: Secure payment gateway for recharges
- **Dashboard Analytics**: Visual statistics and recent activity

### 📄 **eSign Platform (Adobe Acrobat-like)**
- **Document Upload**: Upload PDF documents (up to 10MB)
- **Digital Signatures**: Create signatures by drawing or typing
- **Inline PDF Editor**: Drag-and-drop signature positioning
- **Real PDF Embedding**: Signatures embedded directly into PDFs using pdf-lib
- **Multiple Positions**: Bottom Right, Bottom Left, Center, Custom
- **Visual Preview**: See signature placement before signing
- **Document Management**: Track document status and history
- **Secure Storage**: Encrypted signature storage

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Interface**: Minimalist black, white, and gray theme
- **Interactive Components**: Smooth animations and transitions
- **Real-time Updates**: Live data synchronization
- **Loading States**: Professional loading indicators

## 🛠️ Tech Stack

### **Frontend**
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Toast notifications
- **React Router**: Client-side routing

### **Backend**
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **Multer**: File upload handling
- **pdf-lib**: PDF manipulation library
- **Sharp**: Image processing library

### **Payment Integration**
- **Razorpay**: Payment gateway integration
- **Webhook Handling**: Secure payment verification

## 📁 Project Structure

```
wallet/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main app component
│   └── public/             # Static assets
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routers/        # API routes
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Express app
│   └── uploads/            # File uploads
└── README.md               # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/wallet.git
cd wallet
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/wallet
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Start the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080

## 📚 API Documentation

### Authentication Endpoints
```
POST /v1/auth/register     # User registration
POST /v1/auth/login        # User login
GET  /v1/auth/profile      # Get user profile
```

### Wallet Endpoints
```
GET  /v1/wallet/balance           # Get user balance
POST /v1/wallet/transfer          # Transfer money
GET  /v1/wallet/transactions      # Get transaction history
GET  /v1/wallet/dashboard         # Get dashboard stats
```

### Payment Endpoints
```
POST /v1/payments/recharge        # Create recharge
POST /v1/payments/verify          # Verify payment
GET  /v1/payments/history         # Get recharge history
```

### eSign Endpoints
```
GET  /v1/esign/documents          # Get user documents
POST /v1/esign/upload             # Upload PDF document
POST /v1/esign/send               # Send document for signature
POST /v1/esign/sign/:id           # Sign document
GET  /v1/esign/download/:id       # Download signed document
GET  /v1/esign/stats              # Get document statistics
POST /v1/esign/preview-signature  # Preview signature on document
POST /v1/esign/visual-signature   # Create visual signature overlay
GET  /v1/esign/signature-positions # Get available positions
GET  /v1/esign/check-signed/:id   # Check if document is signed
GET  /v1/esign/pdf-metadata/:id   # Get PDF metadata
```

## 🎯 eSign Features in Detail

### **Document Management**
- Upload PDF documents (max 10MB)
- Track document status (pending, sent, signed, expired)
- View document history and statistics
- Download original and signed documents

### **Signature Creation**
- **Draw Mode**: Freehand signature with mouse/touch
- **Type Mode**: Text-based signature with custom styling
- **Customization**: Color picker, line thickness, font options
- **Real-time Preview**: See signature as you create it

### **Inline PDF Editor**
- **Drag & Drop**: Move signature anywhere on the PDF
- **Precise Controls**: X, Y, width, height sliders
- **Quick Positions**: Preset position buttons
- **Real-time Updates**: Live position display
- **Boundary Constraints**: Signature stays within PDF bounds

### **PDF Embedding**
- **Real PDF Integration**: Signatures embedded using pdf-lib
- **Image Processing**: Optimized signatures with Sharp
- **Metadata Addition**: Signer name, date, and position
- **Custom Positions**: Exact coordinate positioning

### **Visual Features**
- **PDF Preview**: See actual PDF with embedded signatures
- **Visual Overlays**: HTML-based signature preview
- **Position Selection**: Choose signature location
- **Document Status**: Track signing progress

## 🔐 Security Features

### **Authentication & Authorization**
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes and middleware
- Session management

### **Data Security**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- File upload security

### **Payment Security**
- Razorpay integration
- Webhook verification
- Secure payment processing
- Transaction encryption

### **Document Security**
- Encrypted signature storage
- Secure file uploads
- Access control for documents
- Audit trail for signatures

## 🎨 UI Components

### **Dashboard**
- Balance display
- Recent transactions
- Quick actions
- Statistics cards

### **Wallet Features**
- Transfer money
- View transaction history
- Recharge wallet
- Payment verification

### **eSign Interface**
- Document upload
- Signature creation
- Inline PDF editor
- Document management

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured interface
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly controls

## 🚀 Deployment

### **Backend Deployment**
```bash
# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export MONGODB_URI=your_production_mongodb_uri
export JWT_SECRET=your_production_jwt_secret

# Start the server
npm start
```

### **Frontend Deployment**
```bash
# Build the application
npm run build

# Serve the build folder
npx serve -s build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<<<<<<< HEAD
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

=======
>>>>>>> e8b5f841fc09524ca2f4149ccac6db487ebdc219
## 🆘 Support

For support, email support@wallet.com or create an issue in the repository.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Digital wallet functionality
- eSign platform with PDF embedding
- Inline PDF editor
- Razorpay integration
- Responsive design

## 🙏 Acknowledgments

- [React](https://reactjs.org/) for the frontend framework
- [Express](https://expressjs.com/) for the backend framework
- [MongoDB](https://www.mongodb.com/) for the database
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation
- [Razorpay](https://razorpay.com/) for payment processing

---

**Built with ❤️ using modern web technologies**
