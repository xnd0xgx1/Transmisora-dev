import { Schema, model } from 'mongoose';
import IAddress from '../interfaces/IAddress';

const schema = new Schema<IAddress>({
    createdAt: { type: Date, default: Date.now },
    country: { type: String },
    state: { type: String },
    municipality: { type: String },
    city: { type: String },
    suburb: { type: String },
    street: { type: String },
    exteriorNumber: { type: String },
    interiorNumber: { type: String },
    cp: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    constitutionDate: { type: Date }
}, { timestamps: true });

const Address = model<IAddress>('Address', schema);
export default Address;
