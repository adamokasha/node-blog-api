const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Post} = require('./../../models/post');
const {User} = require('./../../models/user');

const userOneId = new ObjectID;
const userTwoId = new ObjectID;

const users = [
  {
    _id: userOneId,
    email: 'userone@example.com',
    password: 'useronepass',
    displayName: 'userone',
    role: 'admin',
    token: jwt.sign({_id: userOneId, role: 'admin'}, process.env.JWT_SECRET).toString()
  },
  {
    _id: userTwoId,
    email: 'usertwo@example.com',
    password: 'usertwopass',
    displayName: 'usertwo',
    role: 'user',
    token: jwt.sign({_id: userTwoId, role: 'user'}, process.env.JWT_SECRET).toString()
  }
];

const posts = [
  {
    _id: new ObjectID(),
    title: 'First title',
    author: 'userone',
    // Dates stored as ISOString in db
    createdAt: new Date(2017, 1, 1, 0, 0, 0, 0).toISOString(),
    category: 'General',
    body: 'This is the first post body',
    comments: []
  },
  {
    _id: new ObjectID(),
    title: 'Second title',
    author: 'userone',
    createdAt: new Date(2018, 1, 1, 0, 0, 0, 0).toISOString(),
    category: 'Other',
    body: 'This is the second post body',
    comments: []
  }
];

const populatePosts = (done) => {
  Post.remove({}).then(() => {
    Post.insertMany(posts);
  }).then(() => done());
}

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = new User(users[0]).save();
    const userTwo = new User(users[1]).save();

    // Callback only called when all promises in array resolve
    Promise.all([userOne, userTwo]);
  }).then(() => done());
}

module.exports = {
  users,
  populateUsers,
  posts,
  populatePosts
};