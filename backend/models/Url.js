import mongoose from 'mongoose';
import shortid from 'shortid';

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  clicks: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String
  }]
}, { timestamps: true });

urlSchema.pre('save', function(next) {
  if (!this.shortUrl) {
    this.shortUrl = this.customAlias || shortid.generate();
  }
  next();
});

export default mongoose.model('Url', urlSchema);