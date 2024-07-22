import { Schema, model } from 'mongoose';
import ICard from '../interfaces/ICard';

const schema = new Schema<ICard>({
    cardId: { type: String },
    affinityGroupId: { type: String },
    cardType: { type: String },
    status: { type: String },
    userId: { type: String },
    startDate: { type: String },
    affinityGroupName: { type: String },
    lastFour: { type: String },
    provider: { type: String },
    productType: { type: String },
    type: { type: String },
    blocked: { type: Boolean },
    cuenta: { type: String },
    nombrebanco: { type: String },
    nombre: { type: String },
    direccion: { type: String },
    currency : { type: String }
}, { timestamps: true });

const Card = model<ICard>('Card', schema, 'cards');
export default Card;
