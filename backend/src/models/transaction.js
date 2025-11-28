const mongoose = require('mongoose');
const newUid = require('../utils/uuidGenerator');

const transactionSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: newUid('txn')
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        maxLength: 100
    },
    source: {
        type: String,
        required: true,
        ref: 'Customer'
    },
    destination: {
        type: String,
        required: true,
        ref: 'Customer'
    },
    status: {
        type: String,
        enum: ['created', 'pending', 'captured', 'refunded', 'failed'],
        required : true 
    }
}, {
    timestamps: true
})

const Transaction = mongoose.model('Transaction', transactionSchema)
Transaction.createCollection();

module.exports = Transaction
