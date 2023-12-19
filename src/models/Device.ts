import { Schema, model } from 'mongoose';
import IDevice from '../interfaces/IDevice';

const schema = new Schema<IDevice>({
    isVerify: { type: Boolean, default: false },
    verifyCode: { type: String },
    sessionDate: { type: Date },
    deviceToken: { type: String, require: true },
    activeSesion: { type: Boolean, default: false },
    info: { type: String },
    user: { type: String, required: true },
}, { timestamps: true });

const Device = model<IDevice>('Device', schema, 'devices');
export default Device;
