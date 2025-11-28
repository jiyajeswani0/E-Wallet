const express = require('express')
const auth = require('../middleware/auth')
const razorpayController = require('../controllers/razorpay')

const router = new express.Router()

router.post('/v1/payments/create-order', auth, razorpayController.order)
router.post('/v1/payments/verify', auth, razorpayController.payment)
router.get('/v1/payments/history', auth, razorpayController.getRechargeHistory)

module.exports = router
