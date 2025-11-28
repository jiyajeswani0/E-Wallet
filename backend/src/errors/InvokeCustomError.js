const errors = {
    ValidationError: {
        status: 400,
        code: 'ValidationError',
        message: (err) => {
            const errors = {}
            Object.values(err.errors).map(val =>
                errors[val.path] = val.message
            )
            return errors
        }
    },
    MongoError: {
        status: 400,
        code: 'MongoError',
        message: 'Another user with this username/email already exists.'
    },
    MongoNetworkError: {
        status: 500,
        code: 'MongoNetworkError',
        message: 'Internal server error! Please try again later.'
    },

    // custom errors
    AccountNotFoundError: {
        status: 404,
        code: 'AccountNotFoundError',
        message: 'Sorry, we couldn\'t find an account with that username or password is incorrect.'
    },
    AccountTransferError: {
        status: 400,
        code: 'AccountTransferError',
        message: 'Self transfer is not allowed! Try again transferring to different account.'
    },
    AccountNotAuthorizeError: {
        status: 401,
        code: 'AccountNotAuthorizeError',
        message: 'Session has been expired!! Login to continue.'
    },
    PayloadValidationError: {
        status: 416,
        code: 'PayloadValidationError',
    },
    InvalidCaptchaError: {
        status: 500,
        code: 'InvalidCaptchaError',
        message: 'Error verifying reCAPTCHA!!'
    },
    AccountUpdateNotValidError: {
        status: 400,
        code: 'AccountUpdateNotValidError',
        message: 'Invalid updates! Please try again with new values to update.'

    },
    AccountAvatarUploadError: {
        status: 500,
        code: 'AccountAvatarUploadError',
        message: 'Avatar cannot be uploaded right now! Please try again later'
    },
    RazorpayCreateOrderError: {
        status: 424,
        code: 'RazorpayCreateOrderError',
        message: 'Razorpay cannot process your request right now! Please try again later.'
    },
}

class InvokeCustomError extends Error {
    constructor (code, description='') {
        const { status, message } = errors[code]

        super(description ? description : message)
        Error.captureStackTrace(this, this.constructor);
    
        this.name = code
        this.status = status
    }
}

module.exports = { InvokeCustomError, errors }
