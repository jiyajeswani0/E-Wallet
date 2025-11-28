const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const moment = require('moment');
const newUid = require('../utils/uuidGenerator');
const Card = require('./card');

const customerSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: newUid('cus')
    },
    first_name: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!/^(?=[a-zA-Z]{3,15}$)/.test(value)) {
                throw new Error('Name should consist of letters between 3 to 15 characters long.');
            }
        }
    },
    last_name: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!/^(?=[a-zA-Z]{3,15}$)/.test(value)) {
                throw new Error('Name should consist of letters between 3 to 15 characters long.');
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email address is invalid!')
            }
        }
    },
    password: {
        type: String,
        trim: true,
        required: true,
        validate(value) {
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(value)) {
                throw new Error('Passwords must have upper and lower case letters, at least 1 number and special character and be at least 8 characters long.');  
            }
        }
    },
    transactions: [
        { type: String, ref: 'Transaction'}
    ],
    card: {
        type: String, 
        ref: 'Card'
    }
}, {
    timestamps: true,
})

customerSchema.virtual('customer', {
    ref: 'Card',
    localField: '_id',
    foreignField: 'customer'
})

customerSchema.methods.toJSON = function () {
    const customer = this.toObject()
    delete customer.password
    delete customer.updatedAt
    delete customer.transactions
    return customer
}

customerSchema.methods.generateAuthToken = async function () {
    const customer = this
    const token = jwt.sign(
        { _id: customer._id.toString(), name: `${customer.first_name} ${customer.last_name}` }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
    )

    return token
}

customerSchema.statics.findByCredentials = async (email, password='') => {
    const cus = await customer.findOne({ email })
    if (!cus) return false;
    
    const isMatch = await bcrypt.compare(password, cus.password)
    if (!isMatch && password) return false;
    return cus
}

customerSchema.pre('remove', async function(next) {
    const customer = this
    await Task.deleteMany({ owner: customer._id })
    next()
})

// Hash the plain text password before saving
customerSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }

    if (this.isNew) {
        const card = new Card({ customer: this._id });
        await card.save();
        this.card = card;
    }

    next()
})

const customer = mongoose.model('Customer', customerSchema);

module.exports = customer;
