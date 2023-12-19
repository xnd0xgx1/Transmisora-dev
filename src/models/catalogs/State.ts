import { Schema, model } from 'mongoose';
import IState from '../../interfaces/catalogs/IState';

const schema = new Schema<IState>({
    createdAt: { type: Date, default: Date.now },
    name: { type: String },
});

const State = model<IState>('State', schema);
export default State;
