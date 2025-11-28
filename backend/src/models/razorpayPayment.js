const mongoose = require('mongoose')

const razorpayPaymentSchema = new mongoose.Schema({
    // _id corresponds to Razorpay payment id
    _id: {
        type: String,
        required: true,
        unique: true
    },
    razorpay_order: {
        type: String,
        required: true
    },
    description: {
        type: String,
        maxLength: 40,
        default: 'Recharge via Razorpay'
    },
    // amount is in INR
    amount: {
        type: Number,
        required: true,
        integer: true
    },
    status: {
        type: String,
        enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
        required : true 
    },
    method: {
        type: String,
        enum: ['card', 'netbanking', 'wallet', 'emi', 'upi'],
        required : true 
    },
    customer: {
        type: String, 
        ref: 'Customer',
        required: true
    },
    error_description: {
        type: String,
        trim: true
    },
    error_code: {
        type: String,
        trim: true 
    }
}, {
    timestamps: true
})

const RazorpayPayment = mongoose.model('RazorpayPayment', razorpayPaymentSchema)
RazorpayPayment.createCollection();

module.exports = RazorpayPayment
