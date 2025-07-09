import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  instructions: {
    type: String,
    maxlength: 300,
    trim: true,
    default: ""
  },
  hours: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  totalHours: {
    type: Number,
    required: true
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ""
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  imageUrl: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'archived'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  joinedVolunteers: {
    type: [String], // Array of user IDs
    default: []
  }
}, {
  timestamps: true
});

// Indexes for performance
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for formatted date
projectSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Ensure virtuals are serialized
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project; 