import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
  },
  authorEmail: {
    type: String,
  },
  authorImage: {
    type: String,
  },
}, {
  timestamps: true,
});

const CandidateSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
  },

  sentToSlack:{
    type:Boolean
  },
  sentToManatal:{
    type:Boolean
  },
  sentToClickUp:{
    type:Boolean
  },

  managerComment: {
    type: String,
  },
  comments: {
    type: [CommentSchema],
    default: [],
  },
  webhookResponse: {
    type: Object,
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days from creation
    index: { expires: 0 },
  },
}, {
  timestamps: true,
});

export default mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
