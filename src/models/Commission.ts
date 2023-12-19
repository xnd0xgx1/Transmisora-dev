import { Schema, model } from 'mongoose';
import ICommission from '../interfaces/ICommission';

const schema = new Schema<ICommission>({
    createdAt: { type: Date, default: Date.now },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    value: { type: Number, required: true },
}, { timestamps: true });

const Commission = model<ICommission>('Commission', schema, 'commissions');
export default Commission;
