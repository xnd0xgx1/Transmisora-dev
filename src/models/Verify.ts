import { Schema, model } from 'mongoose';
import IVerify from '../interfaces/IVerify';

const schema = new Schema<IVerify>({
    createdAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: Date.now },
    value: { type: String },
    otp: { type: Schema.Types.ObjectId, ref: 'OTP' }
}, { timestamps: true });

const Verify = model<IVerify>('Verify', schema);
export default Verify;
