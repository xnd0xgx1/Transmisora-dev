import { Schema, model } from 'mongoose';
import IInvoice from '../interfaces/IInvoice';

const schema = new Schema<IInvoice>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    email: { type: String, required: true },
    data: { type: String, required: true },
}, { timestamps: true });

const Invoice = model<IInvoice>('Invoice', schema, 'invoices');
export default Invoice;
