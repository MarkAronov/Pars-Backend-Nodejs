import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/usersModel';

const userID = new mongoose.Types.ObjectId();
const testUser = {
  name: 'test0',
  email: 'test0@testing.com',
  password: 'Password123',
  _id: userID,
  tokens: [
    {
      token: jwt.sign({ id: userID }, process.env.JWT_STRING, {
        expiresIn: '14d',
      }),
    },
  ],
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(testUser).save();
});

test('Should sign up a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'test2',
      email: 'test2@testing.com',
      password: 'Password12345678',
    })
    .expect(201);
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      name: 'test2',
      email: 'test2@testing.com',
    },
    token: user.tokens[0].token,
  });

  expect(user.password).not.toBe('Password12345678');
});

test('Should not sign up for a new user due to email', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'test2',
      email: 'test0@testing.com',
      password: 'Password12345678',
    })
    .expect(400);

  console.log(response.text);
});

test('Should not sign up for a new user due to name', async () => {
  await request(app)
    .post('/users')
    .send({
      name: 'test0',
      email: 'test2@testing.com',
      password: 'Password12345678',
    })
    .expect(400);
});

test('Should log in a user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'test0@testing.com',
      password: 'Password123',
    })
    .expect(200);
});

test('Should not log in due to wrong password', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'test0@testing.com',
      password: 'Password12345678',
    })
    .expect(400);
});

test('Should not log in due to using a non existing email', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'testNone@testing.com',
      password: 'Password',
    })
    .expect(400);
});

test('Should get own user profile', async () => {
  await request(app)
    .get(`/users/${testUser.name}`)
    .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get own user profile without authorization', async () => {
  await request(app).get(`/users/${testUser.name}`).send().expect(401);
});

test('Should delete own user profile', async () => {
  await request(app)
    .delete(`/users/me`)
    .set('Authorization', `Bearer ${testUser.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not delete own user profile without authorization', async () => {
  await request(app).delete(`/users/me`).send().expect(401);
});
