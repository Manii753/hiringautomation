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
}, {
  timestamps: true,
});

export default mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
