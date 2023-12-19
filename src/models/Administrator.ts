import { Schema, model } from 'mongoose';
import IAdministrator from '../interfaces/IAdministrator';

const schema = new Schema<IAdministrator>({
    createdAt: { type: Date, default: Date.now },
    firstName: { type: String },
    lastName: { type: String },
    mothersLastName: { type: String },
    ineFront: { type: Schema.Types.ObjectId, ref: 'File' },
    ineBack: { type: Schema.Types.ObjectId, ref: 'File' },
    ineStatus: { type: String },
    veridocId: { type: String },
}, { timestamps: true });

const Administrator = model<IAdministrator>('Administrator', schema);
export default Administrator;
