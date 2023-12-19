import { Schema, model } from 'mongoose';
import IAuction from '../interfaces/IAuction';

const schema = new Schema<IAuction>({
    createdAt: { type: Date, default: Date.now },
    status: { type: String, require: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accumulated: { type: Number, required: true },
    amount: { type: Number, required: true },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    purchaseOffers: [{ type: Schema.Types.ObjectId, ref: 'PurchaseOffer', required: true }],
}, { timestamps: true });

const Auction = model<IAuction>('Auction', schema, 'auctions');
export default Auction;
