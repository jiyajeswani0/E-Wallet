const express = require('express')
const auth = require('../middleware/auth')
const transactionController = require('../controllers/transaction')

const router = new express.Router()

router.post('/v1/transfers/send', auth, transactionController.transfer)
router.get('/v1/transfers/history', auth, transactionController.get_transfer_history)
router.get('/v1/transfers/recent', auth, transactionController.getRecentTransactions)
router.get('/v1/transfers/export', auth, transactionController.export_transfer_history)

module.exports = router
