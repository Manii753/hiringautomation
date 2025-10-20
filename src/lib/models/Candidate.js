import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
  },
  managerComment: {
    type: String,
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
