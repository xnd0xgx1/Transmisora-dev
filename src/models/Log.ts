import mongoose from 'mongoose';
import ILog from '../interfaces/ILog';

const schema = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    message: { type: String, required: true },
}, { timestamps: true });

const logModel = mongoose.model<ILog & mongoose.Document>('Log', schema);
export default logModel;
