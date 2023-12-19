import { Schema, model } from 'mongoose';
import ICountry from '../../interfaces/catalogs/ICountry';

const schema = new Schema<ICountry>({
    createdAt: { type: Date, default: Date.now },
    name: { type: String },
    states: [{ type: Schema.Types.ObjectId, ref: 'State' }],
});

const Country = model<ICountry>('Country', schema);
export default Country;
