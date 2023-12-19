import { Schema, model } from 'mongoose';

import StatusVerification from '../enums/StatusVerification';
import IVerification from '../interfaces/IVerification';

const schema = new Schema<IVerification>({
    createdAt: { type: Date, default: Date.now },
    useDate: { type: Date, default: Date.now },
    user: { type: String, required: true },
    code: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    statusVerification: { type: String, default: StatusVerification.ACTIVE }
}, { timestamps: true });

const Verification = model<IVerification>('Verification', schema);
export default Verification;
