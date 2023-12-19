import { Schema, model } from 'mongoose';
import IPurchaseOffer from '../interfaces/IPurchaseOffer';

const schema = new Schema<IPurchaseOffer>({
    createdAt: { type: Date, default: Date.now },
    status: { type: String, require: true },
    auction: { type: Schema.Types.ObjectId, ref: 'Auction' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    exchangeRateBase: { type: Number, required: true },
    exchangeRate: { type: Number, required: true },
    // exchangeRate: { type: Schema.Types.ObjectId, ref: 'ExchangeRate', required: true },
}, { timestamps: true });

const PurchaseOffer = model<IPurchaseOffer>('PurchaseOffer', schema, 'purchaseOffers');
export default PurchaseOffer;
