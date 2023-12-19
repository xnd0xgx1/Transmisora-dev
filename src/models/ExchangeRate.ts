import { Schema, model } from 'mongoose';
import IBase from '../interfaces/IBase';

const schema = new Schema<IBase>({
    location: { type: String, required: true },
    city: { type: String, required: true },
    status: { type: String, required: true, default: 'ACTIVE' },
    sell: { type: Number, required: true },
    buy: { type: Number, required: true },
    latitude: { type: Number, required: true, default: 0 },
    longitude: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const ExchangeRate = model<IBase>('ExchangeRate', schema, 'exchangeRates');
export default ExchangeRate;
