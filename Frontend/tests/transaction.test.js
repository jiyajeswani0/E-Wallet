const request = require('supertest')
const app = require('../app')
const User = require('../src/models/user')
const Transaction = require('../src/models/transaction')


jest.setTimeout(100000000)
const userOne = {
    username: 'abhay1808',
    email: 'abhay1808@example.com',
    password: 'Abhay@1808',
    balance: 100
}

const userTwo = {
    username: 'akshay1808',
    email: 'akshay1808@example.com',
    password: 'Akshay@1808'
}

afterEach(async () => {
    await User.deleteMany()
    await Transaction.deleteMany()
})

// beforeEach(async () => {
//     await User.deleteMany()
//     await Transaction.deleteMany()
// })

// test('Should throw AccountNotAuthorizeError at transfer', async () => {
//     const payee = await User(userOne).save()
//     const payer = await User(userTwo).save()

//     await request(app).post("/api/login").send(userOne).expect(200) // login to make an transfer

//     await request(app).post('/api/transfer').send({
//         payer: payer.email,
//         payee: payee.email,
//         amount: 10,
//         note: 'Test transaction',
//     }).set('Authorization', `Bearer IntenionallySendWrongToken`).expect(401) // error: Session has been expired!! Login to continue.
// })

// test('Should throw Payee AccountNotFoundError at transfer', async () => {
//     const payer = await User(userOne).save()

//     const respLogin = await request(app).post("/api/login").send(userOne) // login to make an transfer
//     expect(respLogin.statusCode).toBe(200)
//     const accessToken = respLogin.body.token

//     await request(app).post('/api/transfer').send({
//         payer: payer.email,
//         password: userOne.password,
//         payee: 'ankit1808@example.com', // not an registered user
//         amount: 10,
//         note: 'Test transaction',
//     }).set('Authorization', `Bearer ${accessToken}`).expect(400) // error: 'Sorry, we couldn\'t find an account with that username or password is incorrect.'
// })

// test('Should throw Payer AccountNotFoundError at transfer', async () => {
//     const payer = await User(userOne).save()
//     const payee = await User(userTwo).save()

//     const respLogin = await request(app).post("/api/login").send(userOne) // login to make an transfer
//     expect(respLogin.statusCode).toBe(200)
//     const accessToken = respLogin.body.token

//     await request(app).post('/api/transfer').send({
//         payer: payer.email,
//         password: 'IntentionallySendWrongPassword',
//         payee: payee.email,
//         amount: 10,
//         note: 'Test transaction',
//     }).set('Authorization', `Bearer ${accessToken}`).expect(400) // error: 'Sorry, we couldn\'t find an account with that username or password is incorrect.'
// })

// test('Should throw PayloadValidationError by sending amount <= 0 or amount > 500', async () => {
//     const payer = await User(userOne).save()
//     const payee = await User(userTwo).save()

//     const respLogin = await request(app).post("/api/login").send(userOne) // login to make an transfer
//     expect(respLogin.statusCode).toBe(200)
//     const accessToken = respLogin.body.token

//     await request(app).post('/api/transfer').send({
//         payer: payer.email,
//         password: userOne.password,
//         payee: payee.email,
//         amount: 501, //invalid amount 
//         note: 'Test transaction',
//     }).set('Authorization', `Bearer ${accessToken}`).expect(416)
// })

// test('Should throw PayloadValidationError for insufficient funds', async () => {
//     const payer = await User(userOne).save()
//     const payee = await User(userTwo).save()

//     const respLogin = await request(app).post("/api/login").send(userOne) // login to make an transfer
//     expect(respLogin.statusCode).toBe(200)
//     const accessToken = respLogin.body.token

//     await request(app).post('/api/transfer').send({
//         payer: payer.email,
//         password: userOne.password,
//         payee: payee.email,
//         amount: 101, // payer balance is 100
//         note: 'Test transaction',
//     }).set('Authorization', `Bearer ${accessToken}`).expect(416)
// })

test('Should throw ', async () => {
    const payer = await User(userOne).save()
    const payee = await User(userTwo).save()

    const respLogin = await request(app).post("/api/login").send(userOne) // login to make an transfer
    expect(respLogin.statusCode).toBe(200)
    const accessToken = respLogin.body.token

    await request(app).post('/api/transfer').send({
        payer: payer.email,
        password: userOne.password,
        payee: payee.email,
        amount: 10, // payer balance is 100
        note: 'Test transaction',
    }).set('Authorization', `Bearer ${accessToken}`)
})



