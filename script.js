const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

mongoose.connect('mongodb://localhost/social-network', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const reactionSchema = new mongoose.Schema({
    reactionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    reactionBody: {
      type: String,
      required: true,
      maxlength: 280,
    },
    username: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: (timestamp) => new Date(timestamp).toLocaleString(),
    },
  });
  
  
  const thoughtSchema = new mongoose.Schema({
    thoughtText: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 280,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      get: (timestamp) => new Date(timestamp).toLocaleString(),
    },
    username: {
      type: String,
      required: true,
    },
    reactions: [reactionSchema],
  });
  
  
  const userSchema = new mongoose.Schema({
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\S+@\S+\.\S+$/,
    },
    thoughts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thought',
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  });
  
  userSchema.virtual('friendCount').get(function () {
    return this.friends.length;
  });
  
  
  thoughtSchema.virtual('reactionCount').get(function () {
    return this.reactions.length;
  });

  const User = mongoose.model('User', userSchema);
  const Thought = mongoose.model('Thought', thoughtSchema);
  app.get('/api/users', async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .populate('thoughts')
        .populate('friends');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  app.post('/api/users', async (req, res) => {
    try {
      const newUser = await User.create(req.body);
      res.json(newUser);
    } catch (error) {
      res.status(400).json({ error: 'Invalid Request Body' });
    }
  });
  
  app.put('/api/users/:userId', async (req, res) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        req.body,
        { new: true }
      );
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: 'Invalid Request Body' });
    }
  });

  app.delete('/api/users/:userId', async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.userId);
      res.json(deletedUser);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/api/users/:userId/friends/:friendId', async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { $addToSet: { friends: req.params.friendId } },
        { new: true }
      );
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.delete('/api/users/:userId/friends/:friendId', async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { $pull: { friends: req.params.friendId } },
        { new: true }
      );
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  app.get('/api/thoughts', async (req, res) => {
    try {
      const thoughts = await Thought.find();
      res.json(thoughts);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  app.get('/api/thoughts/:thoughtId', async (req, res) => {
    try {
      const thought = await Thought.findById(req.params.thoughtId);
      res.json(thought);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  app.post('/api/thoughts', async (req, res) => {
    try {
      const newThought = await Thought.create(req.body);
      await User.findByIdAndUpdate(req.body.userId, {
        $push: { thoughts: newThought._id },
      });
      res.json(newThought);
    } catch (error) {
      res.status(400).json({ error: 'Invalid Request Body' });
    }
  });
  
  
  app.put('/api/thoughts/:thoughtId', async (req, res) => {
    try {
      const updatedThought = await Thought.findByIdAndUpdate(
        req.params.thoughtId,
        req.body,
        { new: true }
      );
      res.json(updatedThought);
    } catch (error) {
      res.status(400).json({ error: 'Invalid Request Body' });
    }
  });
  
  
  app.delete('/api/thoughts/:thoughtId', async (req, res) => {
    try {
      const deletedThought = await Thought.findByIdAndDelete(
        req.params.thoughtId
      );
      res.json(deletedThought);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  app.post('/api/thoughts/:thoughtId/reactions', async (req, res) => {
    try {
      const thought = await Thought.findById(req.params.thoughtId);
      if (!thought) {
        return res.status(404).json({ error: 'Thought not found' });
      }
 
      const newReaction = {
        reactionBody: req.body.reactionBody,
        username: req.body.username,
      };
 
      thought.reactions.push(newReaction);
      await thought.save();
 
      res.json(thought);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
 
  app.delete('/api/thoughts/:thoughtId/reactions/:reactionId', async (req, res) => {
    try {
      const thought = await Thought.findById(req.params.thoughtId);
      if (!thought) {
        return res.status(404).json({ error: 'Thought not found' });
      }
 
      thought.reactions = thought.reactions.filter(
        (reaction) => reaction.reactionId.toString() !== req.params.reactionId
      );
 
      await thought.save();
 
      res.json(thought);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });