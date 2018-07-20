const request = require('supertest');
const expect = require('expect');

const {app} = require('./../server');
const {Post} = require('./../models/post');
const {User} = require('./../models/user');
const {users, populateUsers, posts, populatePosts} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populatePosts);

describe('GET /posts', () => {
  it('should get posts', (done) => {
    request(app)
      .get('/posts')
      .expect(200)
      .expect((res) => {
        expect(res.body.posts.length).toEqual(2);
      })
      .end(done);
  });
});

describe('POST /posts', () => {

  const dummyPost = {
    title: 'Dummy title',
    category: 'Birds',
    body: 'The body here'
  }

  it('should add a post for a user with admin role', (done) => {
    request(app)
      .post('/posts')
      .set('x-auth', users[0].token)
      .send(dummyPost)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject(dummyPost);
      })
      .end(async (err, res) => {
        try {
          const posts = await Post.find();
          expect(posts.length).toBe(3);
          done()
        } catch (e) {
          return done(e);
        }
      });
  });

  it('should not add a post for a user without admin role', (done) => {
    request(app)
    .post('/posts')
    .set('x-auth', users[1].token)
    .send(dummyPost)
    .expect(401)
    .end(async (err, res) => {
       try {
        const posts = await Post.find();
        expect(posts.length).toBe(2);
        done();
      } catch (e) {
        return done(e);
      }
    });
  });
});

describe('PATCH /posts/:id', () => {
  const updates = {
    title: 'Edited title',
    category: 'Different category',
    body: 'Edited body content'
  }

  it('should modify a post if user has admin role', (done) => {
    request(app)
      .patch(`/posts/${posts[0]._id.toHexString()}`)
      .set('x-auth', users[0].token)
      .send(updates)
      .expect(200)
      .expect((res) => {
        expect(res.body.post).toMatchObject(updates);
      })
      .end(done);
  });

  it('should not modify a post is user does not have admin role', (done) => {
    request(app)
      .patch(`/posts/${posts[0]._id.toHexString()}`)
      .set('x-auth', users[1].token)
      .send(updates)
      .expect(401)
      .end(done)
  });
});

describe('DELETE /posts/:id', () => {
  it('should delete a post if user has admin role', (done) => {
    request(app)
      .del(`/posts/${posts[0]._id.toHexString()}`)
      .set('x-auth', users[0].token)
      .expect(200)
      .end(async (err, res) => {
        try {
          const posts = await Post.find();
          expect(posts.length).toBe(1);
          done()
        } catch (e) {
          return done(e);
        }
      });
  });

  it('should not delete a post if user does not have admin role', (done) => {
    request(app)
    .del(`/posts/${posts[0]._id.toHexString()}`)
    .set('x-auth', users[1].token)
    .expect(401)
    .end(async (err, res) => {
      try {
        const posts = await Post.find();
        expect(posts.length).toBe(2);
        done()
      } catch (e) {
        return done(e);
      }
    });
  });
});

describe('POST /posts/:id/comments', () => {
  const comment = {
    comment: 'A great comment'
  }
  
  it('should post a comment if a user is authenticated', (done) => {
    request(app)
      .post(`/posts/${posts[0]._id.toHexString()}/comments`)
      .set('x-auth', users[1].token)
      .send(comment)
      .expect(200)
      .expect((res) => {
        expect(res.body.post.comments[0]).toMatchObject(comment);
      })
      .end(done);
  });

  it('should not post a comment if user cannot be authenticated', (done) => {
    request(app)
      .post(`/posts/${posts[0]._id.toHexString()}/comments`)
      .set('x-auth', users[1].token + '123')
      .send(comment)
      .expect(401)
      .end(async (err, res) => {
        try {
          const post = await Post.findOne({_id: posts[0]._id});
          expect(post.comments.length).toBe(0);
          done();
        } catch (e) {
          return done(e);
        }
      });
  });
});

describe('POST /users', (done) => {
  const newUser = {
    email: 'random@example.com',
    password: '123abc',
    displayName: 'User123'
  }

  it('should create a new user', (done) => {
    request(app)
      .post('/users')
      .send(newUser)
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(newUser.email);
      })
      .end(async (err, res) => {
        try {
          const user = await User.findOne({email: newUser.email});
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(newUser.password);
          done();
        } catch (e) {
          return done(e);
        }
      });
  });

  it('should return validation error if signup input invalid', (done) => {    
    request(app)
      .post('/users')
      .send({email: 'notAnEmail', password: '123abc'})
      .expect(400)
      .end(done);
  });

  it('should not create a user if email already in use', (done) => {
    request(app)
      .post('/users')
      .send({email: users[0].email, password: '123abc'})
      .expect(400)
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return token', (done) => {
    request(app)
      .post('/users/login')
      .send({email: users[1].email, password: users[1].password})
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toBeTruthy();
      })
      .end(async (err, res) => {
        try {
          const user = await User.findById(users[1]._id);
          expect(res.header['x-auth']).toBe(user.token);
          done()
        } catch (e) {
          return done(e);
        }       
      });
  });

  it('should reject invalid login credentials', (done) => {
    request(app)
      .post('/users/login')
      .send({email: users[0].email, password: 'badpassword'})
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeFalsy();
      })
      .end(done)
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].token)
      .expect(200)
      .end(async (err, res) => {
        try {
          const user = await User.findById(users[0]._id);
          expect(user.token).toBeFalsy()
          done();
        } catch (e) {
          return done(e);
        }
      });
  });
});