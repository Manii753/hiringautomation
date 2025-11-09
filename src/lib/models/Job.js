import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  clickupTaskId: {
    type: String,
    required: true,
    unique: true,
  }, 
}, {
  timestamps: true,
});

export default mongoose.models.Job || mongoose.model('Job', JobSchema);