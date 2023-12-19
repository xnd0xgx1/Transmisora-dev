import PurchaseOfferStatus from '../enums/PurchaseOfferStatus';
import PurchaseOffer from '../models/PurchaseOffer';
import { BaseRepository } from './base/BaseRepository';

class PurchaseOfferRepository extends BaseRepository<typeof PurchaseOffer> {
    getById(id: string): Promise<typeof PurchaseOffer> {
        return this.collection.findById(id).populate(
            [
                {
                    path: 'user',
                    select: { 'userName': 1, 'avatar': 1, 'color': 1 },
                }
            ]
        );
    }
    getBetweenRange = async (from: number, to: number) => {
        return await PurchaseOffer.find({ exchangeRate: { $gt: from, $lt: to }, status: PurchaseOfferStatus.CREATED });
    }
    getAllByUser(user: any): Promise<typeof PurchaseOffer> {
        return this.collection.find({ user: user, status: { $ne: PurchaseOfferStatus.FINISHED } }).sort({ createdAt: -1 }).populate(
            [
                {
                    path: 'user',
                    select: { 'userName': 1, 'avatar': 1, 'color': 1 },
                }
            ]
        );
    }
    getAllActive(): Promise<typeof PurchaseOffer> {
        return this.collection.find({ status: 'CREATED' });
    }
    getAllActiveByUser(user: any): Promise<typeof PurchaseOffer> {
        return this.collection.find({ user: user, status: 'CREATED' });
    }
}

export default PurchaseOfferRepository;
