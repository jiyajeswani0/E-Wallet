const request = require('supertest')
const app = require('../app')
const User = require('../src/models/user')

const userOne = {
    first_name: 'Abhay',
    last_name: 'Jindal',
    email: 'abhay1808@example.com',
    password: 'Abhay@1808'
}

afterEach(async () => {
    await User.deleteMany()
})

test('Should signup a new user', async () => {
    await request(app).post("/api/register").send(userOne).expect(201)
})

// test('Should throw first_name/last_name validation error', async () => {
//     const resp = await request(app).post("/api/register").send({
//         first_name: 'a', // length is less then 3
//         email: 'abhay@example.com',
//         last_name: 'Jindal',
//         password: 'Abhay@1808'
//     })
//     expect(resp.statusCode).toBe(400) // client error
//     expect(resp.body).toMatchObject({
//         first_name: 'Name should consist of letters between 3 to 15 characters long.' 
//     })
// })

// test('Should throw email validation error', async () => {
//     const resp = await request(app).post("/api/register").send({
//         username: 'abhay1808',
//         email: 'abhayexample.com', // invalid email format
//         password: 'Abhay@1808'
//     })

//     expect(resp.statusCode).toBe(400) // client error
//     expect(resp.body).toMatchObject({
//         email: 'Email address is invalid!' 
//     })
// })

// test('Should throw email/username already exists error', async () => {
//     await new User(userOne).save()
//     const resp = await request(app).post("/api/register").send(userOne)
//     expect(resp.statusCode).toBe(400) // client error
//     expect(resp.body).toMatchObject({
//         error: 'Another user with this username/email already exists.'
//     })
// })

// test('Should throw AccountNotFoundError while logging in', async () => {
    
//     const resp = await request(app).post('/api/login').send(userOne) // userOne is not registered
//     expect(resp.statusCode).toBe(400) // client error

//     expect(resp.body).toMatchObject({
//         error: 'Sorry, we couldn\'t find an account with that username or password is incorrect.'
//     })
// })

// test('Should login an existing user', async () => {
//     await new User(userOne).save() // as after each test previous records are deleted due to beforeEach function used above
//     await request(app).post('/api/login').send(userOne).expect(200)
// })

// test('Should throw AccountNotAuthorizeError while logging out', async () => {
//     await request(app).post('/api/logout').set('Authorization', `Bearer IntentionallySendWrongToken`).expect(401)
   
//     // expect(resp.body).toMatchObject({
//     //     message: 'Session has been expired!! Login to continue.'
//     // })
// })
