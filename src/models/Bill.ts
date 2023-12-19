import { Schema, model } from 'mongoose';
import IBill from '../interfaces/IBill';

const schema = new Schema<IBill>({
    type: { type: String, required: true },
}, { timestamps: true });

const Bill = model<IBill>('Bill', schema, 'bills');
export default Bill;
