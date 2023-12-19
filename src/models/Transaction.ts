import { Schema, model } from 'mongoose';
import ITransaction from '../interfaces/ITransaction';

const schema = new Schema<ITransaction>({
    type: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    cost: { type: Number, required: true },
    data: { type: String, required: true },
}, { timestamps: true });

const Transaction = model<ITransaction>('Transaction', schema, 'transactions');
export default Transaction;
