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
  preferredDate: {
    type: Date,
    required: true
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ""
  },
  urgency: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  imageUrl: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedVolunteer: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
projectSchema.index({ status: 1, urgency: 1 });
projectSchema.index({ preferredDate: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for formatted date
projectSchema.virtual('formattedDate').get(function() {
  return this.preferredDate.toLocaleDateString('en-US', {
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