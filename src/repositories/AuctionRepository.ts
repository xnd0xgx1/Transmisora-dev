import AuctionStatus from '../enums/AuctionStatus';
import Auction from '../models/Auction';
import { BaseRepository } from './base/BaseRepository';

class AuctionRepository extends BaseRepository<typeof Auction> {
    getById(id: string): Promise<typeof Auction> {
        return this.collection.findById(id).populate(
            [
                {
                    path: 'purchaseOffers',
                    populate: {
                        path: 'user',
                        select: { 'userName': 1, 'avatar': 1, 'color': 1 },
                    }
                }
            ]
        );
    }

    getAllActive(): Promise<typeof Auction> {
        return this.collection.find({ status: "CREATED" });
    }

    getAvailable(exchangeRate: number): Promise<typeof Auction> {
        return this.collection.find({ status: "CREATED", from: { $lt: exchangeRate }, to: { $gt: exchangeRate } });
    }

    getAllByUserId(userId: string): Promise<typeof Auction> {
        return this.collection.find({ user: userId, $or: [{ status: AuctionStatus.CREATED }, { status: AuctionStatus.EXECUTED }] }, { _id: 1 });
    }

    async getAllPurchaseOffersByUserId(userId: string): Promise<typeof Auction> {
        const auctions = await this.collection.find({ status: "CREATED" });
        console.log(auctions);
        return auctions.filter((x: any) => x.purchaseOffers.user === userId);
    }

    async getByPurchaseOffersId(id: string): Promise<typeof Auction> {

        // TODO: Optimizar en base de datos.
        const auctions = await this.collection.find().populate(
            [
                {
                    path: 'purchaseOffers',
                    populate: {
                        path: 'user',
                        select: { '_id': 1, 'userName': 1, 'avatar': 1, 'color': 1 },
                    }
                }
            ]
        );
        let auction;
        auctions.forEach(auctionDb => {
            auctionDb.purchaseOffers.forEach(purchaseOffer => {
                if (purchaseOffer._id.toString() === id) {
                    auction = auctionDb
                }
            });
        });

        return auction;
    }

    // CMS
    getAll(): Promise<typeof Auction[]> {
        return this.collection.find({ user: { $ne: null } }).populate('user', 'email phone');
    }
}

export default AuctionRepository;
