import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the todo'],
    maxlength: [60, 'Title cannot be more than 60 characters'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: String,
    required: [true, 'Please provide a user ID'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);