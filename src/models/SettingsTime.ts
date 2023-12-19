import { Schema, model } from 'mongoose';
import IAuction from '../interfaces/IAuction';
import IBase from '../interfaces/IBase';

const schema = new Schema<IBase>({
    hours: { type: Number },
    minutes: { type: Number },
    seconds: { type: Number },
}, { timestamps: true });

const SettingsTime = model<IAuction>('SettingsTime', schema, 'settingsTime');
export default SettingsTime;
