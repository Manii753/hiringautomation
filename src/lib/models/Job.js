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
  mentions:{
    type: String,
  },
  prompt:{
    type: String, 
  }, 
}, {
  timestamps: true,
});

export default mongoose.models.Job || mongoose.model('Job', JobSchema);