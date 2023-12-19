import { Schema, model } from 'mongoose';
import IVerificationCode from '../interfaces/IVerificationCode';

const schema = new Schema<IVerificationCode>({
    createdAt: { type: Date, default: Date.now },
    code: { type: String, required: true },
    isValid: { type: Boolean, required: true, default: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const VerificationCode = model<IVerificationCode>('VerificationCode', schema);
export default VerificationCode;
