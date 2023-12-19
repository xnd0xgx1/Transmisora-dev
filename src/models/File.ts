import { Schema, model } from 'mongoose';
import IFile from '../interfaces/IFile';

const schema = new Schema<IFile>({
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false },
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true, default: 'PENDING' },
    comments: { type: String },
}, { timestamps: true });

const File = model<IFile>('File', schema);
export default File;
