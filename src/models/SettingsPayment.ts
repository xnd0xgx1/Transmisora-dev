import { Schema, model } from 'mongoose';
import IAuction from '../interfaces/IAuction';
import IBase from '../interfaces/IBase';

const schema = new Schema<IBase>({
    amount: { type: Number },
    admin: { type: String },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

const SettingsPayment = model<IAuction>('SettingsPayment', schema, 'settingsPayment');
export default SettingsPayment;
