const jwt = require('jsonwebtoken')
const Customer = require('../models/customer')
const InvokeCustomError = require('../errors/InvokeCustomError')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '').split(',')[0]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const customer = await Customer.findById(decoded._id)
        if (!customer) {
            throw new InvokeCustomError('AccountNotAuthorizeError')
        }

        req.token = token
        req.customer = customer
        next()
    } catch {
        res.status(401).send()
    }
}

module.exports = auth
