require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

const mongoose = require('./db/mongoose');
const {Post} = require('./models/post');
const {User} = require('./models/user');
const {requireAdmin} = require('./middleware/requireAdmin');
const {requireAuthAsync} = require('./middleware/requireAuth');


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).send({posts});
  } catch {
    res.status(400).send();
  }
});

app.post('/posts', requireAdmin, async (req, res) => {
  try {
    const body = _.pick(req.body, ['title', 'category', 'body']);
    const post = new Post({
      title: body.title,
      category: body.category,
      body: body.body
    });

    await post.save();
    res.status(200).send(post);
  } catch (e) {
    res.status(400).send();
  }
});

app.patch('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const body = _.pick(req.body, ['title', 'category', 'body']);

    const post = await Post.findOneAndUpdate(id, {$set: body}, {new: true});
    res.status(200).send({post});
  } catch (e) {
    res.status(400).send();
  }
});

app.delete('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) {
      return res.status(400).send();
    }

    const post = await Post.findByIdAndRemove(id);
    
    if (!post) {
      return res.status(400).send();
    }

    res.status(200).send();
  } catch (e) {
    res.status(400).send();
  }

});

app.post('/posts/:id/comments', requireAuthAsync, async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectID.isValid(id)) {
      return res.status(400).send();
    }

    const body = _.pick(req.body, ['comment']);
    body.createdBy = req.user.displayName;

    const post = await Post.findByIdAndUpdate(id, { $push: {comments: body}}, {new: true});
    res.status(200).send({post});
  } catch (e) {
    res.status(400).send();
  }
});

app.post('/users', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password', 'displayName']);
    const user = new User(body);
    await user.save();
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.delete('/users/me/token', requireAuthAsync, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e);
  }
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`)
});

module.exports = {app};