const mongoose = require('mongoose')

const razorpayOrderSchema = new mongoose.Schema({
    // _id corresponds to Razorpay order id
    _id: {
        type: String,
        required: true,
        unique: true
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
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
    customer: {
        type: String, 
        ref: 'Customer',
        required: true
    },
    createdAt: {
        type: String,
        required: true
    }
})

const RazorpayOrder = mongoose.model('RazorpayOrder', razorpayOrderSchema)
RazorpayOrder.createCollection();
module.exports = RazorpayOrder
