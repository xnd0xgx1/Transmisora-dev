import { Schema, model } from 'mongoose';
import IAuction from '../interfaces/IAuction';
import IBase from '../interfaces/IBase';

const schema = new Schema<IBase>({
    depositoMin: { type: Number },
    depositoMax: { type: Number },
    withdrawalMin: { type: Number },
    withdrawalMax: { type: Number },
    admin: { type: String },
}, { timestamps: true });

const SettingsWithdrawal = model<IAuction>('SettingsWithdrawal', schema, 'settingsWithdrawal');
export default SettingsWithdrawal;
