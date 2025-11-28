const express = require('express')
const auth = require('../middleware/auth')
const customerController = require('../controllers/customer')


const router = new express.Router()

router.post('/v1/customers/register', customerController.addCustomer)
router.post('/v1/customers/login', customerController.getCustomer)
router.get('/v1/customers/profile', auth, customerController.getProfile)
router.get('/v1/customers/balance', auth, customerController.getBalance)
router.get('/v1/customers/dashboard-stats', auth, customerController.getDashboardStats)
router.get('/v1/customers/search', auth, customerController.searchUsers)
router.post('/v1/customers/logout', auth, customerController.post_logout)

module.exports = router
