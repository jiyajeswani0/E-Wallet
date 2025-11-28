const mongoose = require('mongoose');
const newUid = require('../utils/uuidGenerator');

const cardSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: newUid('card')
    },
    amount: {
        type: Number,
        required: true,
        integer: true,
        default: 0
    },
    number: {
        type: String,
        default: Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("")
    },
    customer: {
        type: String, 
        ref: 'Customer'
    },
    static_pin: {
        type: Number,
        integer: true
    },
}, {
    timestamps: true
})

cardSchema.virtual('card', {
    ref: 'Customer',
    localField: '_id',
    foreignField: 'card'
})

cardSchema.methods.toJSON = function () {
    const card = this.toObject()
    return card
}
  

const Card = mongoose.model('Card', cardSchema)
Card.createCollection();

module.exports = Card;
