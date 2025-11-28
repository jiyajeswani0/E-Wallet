const express = require('express')
const cors = require('cors')
require('./src/db/mongoose')

const { auth } = require('express-oauth2-jwt-bearer');

const transactionRouter = require('./src/routers/transaction')
const customerRouter = require('./src/routers/customer')
const razorpayRouter = require('./src/routers/razorpay')
const esignRouter = require('./src/routers/esign')
const { errors } = require('./src/errors/InvokeCustomError')

const app = express()
app.use(express.json())

// Add the client URL to the CORS policy
// const whitelist = process.env.WHITELISTED_DOMAINS 
//   ? process.env.WHITELISTED_DOMAINS.split(',')
//   : []

// const corsOptions = {
//     origin: (origin, callback) => {
//         if (!origin || whitelist.indexOf(origin) !== -1) {
//             callback(null, true)
//         } else {
//             callback(new Error('Not allowed by CORS policy'))
//         }
//     },
//     credentials: true
// }

const jwtCheck = auth({
    audience: 'http://localhost:8080/v1',
    issuerBaseURL: 'https://dev-yu01zpcvrw0c1fq2.us.auth0.com/',
    tokenSigningAlg: 'RS256'
  });

// Set the headers that will be returned by this application.
// "Access-Control-Allow-Origin", "*" is needed for SAM UI to avoid CORS error
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "authorization, cache-control, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "POST, GET, PUT, DELETE, OPTIONS"
    );

    if ("OPTIONS" === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.options("*", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Authorization,Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "POST, GET, PUT, DELETE, OPTIONS"
    );

    res.sendStatus(200);
});

app.use(customerRouter)
// app.use(cors(corsOptions))
app.use(transactionRouter)
app.use(razorpayRouter)
app.use('/v1/esign', esignRouter)

app.use(express.static(`./build`));

// // const root = require('path').join(__dirname, '../build')
// // app.use(express.static(root));
app.get("*", (req, res, next) => {
    console.log(req.url)
   
    res.sendFile("index.html", { root: "./build/" });
    // res.sendFile('index.html', { root: './build/' });
})


/**
* Configures and send appropriate HTTP errors codes and information for repeat
* error cases throughout the application.
*
* @function errorHandler
* @param err An error object
* @param req EpressJS req object
* @param res ExpressJS res object
* @param next ExpressJS next function
*/
function errorHandler(err, req, res, next) {
    if (err.name in errors) {
        const error = errors[err.name]
        const message = err.name === 'ValidationError' ? error.message(err) : error.message
        
        return res.status(error.status).send({
            message: message
        })
    }

    console.log(err)
    
    res.status(500).send({
        message: 'Internal server error! Please try again later.'
    })
}

app.use(errorHandler)
app.listen(8080, () => {
    console.log('Server is up on port number: 8080')
})

module.exports = app
