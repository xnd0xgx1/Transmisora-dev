import { Schema, model } from 'mongoose';
import IOTP from '../interfaces/IOTP';

const schema = new Schema<IOTP>({
    createdAt: { type: Date, default: Date.now },
    isUsed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    user: { type: String, required:true },
    otpType: { type: String, required: true },
    code: { type: String, required: true },
}, { timestamps: true });

const OTP = model<IOTP>('OTP', schema);
export default OTP;
