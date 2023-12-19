import BaseService from "./base/BaseService";
import AuctionRepository from "../repositories/AuctionRepository";
import Auction from "../models/Auction";
import PurchaseOfferService from "./PurchaseOfferService";
import UserService from "./UserService";
import PurchaseOfferStatus from "../enums/PurchaseOfferStatus";
import AuctionStatus from "../enums/AuctionStatus";
import { formatCurrency, getMinutesPassed, getText } from "../common/Utilities";
import TextType from "../enums/TextType";
import TransactionType from "../enums/TransactionType";
import CurrencyType from "../enums/CurrencyType";
import TransactionService from "./TransactionService";
import NotificationService from "./NotificationService";
import SystemService from "./SystemService";
class AuctionService extends BaseService<AuctionRepository> {

    private notificationService = new NotificationService();
    private purchaseOfferService = new PurchaseOfferService();
    private transactionService = new TransactionService();
    private userService = new UserService();
    private systemservice = new SystemService();

    constructor() {
        super(new AuctionRepository(Auction));
    }

    getAllActive = async () => {
        return this.repository.getAllActive();
    }

    getAllByUser = async (user: any) => {
        // const auctions = this.repository.getAllByUserId(user._id);
        // return auctions;
    }

    /**
     * Cretea an auction.
     * 
     * @param user 
     * @param createAuctionDto 
     * @returns 
     */
    createAuction = async (user: any, createAuctionDto: any) => {

        // await this.withdrawUSD(user, createAuctionDto.amount);
        if (user.balanceUSD < createAuctionDto.amount) {
            // Send notification.        
            this.notificationService.sendNotifications(
                user,
                getText(TextType.TRANSACTION_ERROR),
                `${getText(TextType.WITHOUT_FUNDS)} ${formatCurrency(user.balanceUSD)}`,
                {}
            );
            throw new Error(`${getText(TextType.WITHOUT_FUNDS)} ${formatCurrency(user.balanceUSD)}`);
        }

        // TODO: Save transaction.
        user.balanceUSD -= createAuctionDto.amount;
        user.balanceUSD = user.balanceUSD.toFixed(4);
        await this.userService.update(user);

        // // Send notification.        
        // this.notificationService.sendNotifications(
        //     user,
        //     getText(TextType.TRANSACTION_SUCCESS),
        //     `${getText(TextType.TRANSACTION_SUCCESS)}`,
        //     {}
        // );

        // Find purchase offers.

        const purchaseOffers = await this.purchaseOfferService.getBetweenRange(createAuctionDto.from, createAuctionDto.to);

        // TODO: Algorimo para seleccionar las indicadas.
        let amountCollected = 0;
        let purchaseOffersAdd: any = [];
        for (let i = 0; i < purchaseOffers.length; i++) {
            const purchaseOffer = purchaseOffers[i];
            while ((amountCollected + purchaseOffer.amount) <= createAuctionDto.amount) {
                purchaseOffersAdd.push(purchaseOffer);
                amountCollected += purchaseOffer.amount;
                // TODO: Change status of purchaseOffer.
                purchaseOffer.status = PurchaseOfferStatus.EXECUTED;
                await this.purchaseOfferService.update(purchaseOffer);
                break;
            }
        }

        let status = AuctionStatus.CREATED;
        if (amountCollected === createAuctionDto.amount) {
            // TODO: FINISH PURCHASE.
            await this.finishPurchases({
                purchaseOffers: purchaseOffersAdd
            });
            status = AuctionStatus.EXECUTED;
        }

        const auction = await this.repository.create({
            ...createAuctionDto,
            status: status,
            user: user,
            purchaseOffers: purchaseOffersAdd,
            accumulated: amountCollected
        });

        // Send notification.        
        this.notificationService.sendNotifications(
            user,
            getText(TextType.AUCTION_START),
            ` `,
            {}
        );

        if (auction.accumulated === auction.amount) {
            await this.finishAuctionNew(user, auction);
        }

        auction.user = undefined;
        return auction;
    }

    // TODO: Refactor.
    getById = async (id: any) => {
        let auction = await this.repository.getById(id);

        let purchaseOffers = [];
        let gananciaTotal = 0;

        auction.purchaseOffers.forEach((purchaseOffer: any) => {
            let total = purchaseOffer.exchangeRateBase * purchaseOffer.amount;
            gananciaTotal += purchaseOffer.exchangeRate * purchaseOffer.amount;
            purchaseOffers.push({
                ...purchaseOffer._doc,
                amount: purchaseOffer.amount.toFixed(4),
                total: total.toFixed(4),
                exchangeRateBase: purchaseOffer.exchangeRateBase.toFixed(4),
                exchangeRate: purchaseOffer.exchangeRate.toFixed(4),
            });
        });

        auction = {
            ...auction._doc,
            purchaseOffers: purchaseOffers,
            from: auction.from.toFixed(4),
            amount: auction.amount.toFixed(4),
            to: auction.to.toFixed(4),
            accumulated: auction.accumulated.toFixed(4),
            total: gananciaTotal.toFixed(4)
        }

        return auction;
    }

    getByPurchaseOffersId = async (id: any) => {
        let auction = await this.repository.getByPurchaseOffersId(id);

        let purchaseOffers = [];
        let gananciaTotal = 0;

        auction.purchaseOffers.forEach((purchaseOffer: any) => {
            let total = purchaseOffer.exchangeRateBase * purchaseOffer.amount;
            gananciaTotal += purchaseOffer.exchangeRate * purchaseOffer.amount;
            purchaseOffers.push({
                ...purchaseOffer._doc,
                amount: purchaseOffer.amount.toFixed(4),
                total: total.toFixed(4),
                exchangeRateBase: purchaseOffer.exchangeRateBase.toFixed(4),
                exchangeRate: purchaseOffer.exchangeRate.toFixed(4),
            });
        });

        auction = {
            ...auction._doc,
            purchaseOffers: purchaseOffers,
            from: auction.from.toFixed(4),
            amount: auction.amount.toFixed(4),
            to: auction.to.toFixed(4),
            accumulated: auction.accumulated.toFixed(4),
            total: gananciaTotal.toFixed(4)
        }

        return auction;
    }

    execute = async () => {
        const time = await this.systemservice.getTimePlatform();
        const auctions = await this.getAllActive();
        for (let i = 0; i < auctions.length; i++) {
            const auction = auctions[i];
            if (getMinutesPassed(auction.createdAt) >= time) {
                await this.finish(auction._id)
            }
        }
        
        const purchaseOffers = await this.purchaseOfferService.getAllActive();
        for (let i = 0; i < purchaseOffers.length; i++) {
            const purchaseOffer = purchaseOffers[i];
            if (getMinutesPassed(purchaseOffer.createdAt) >= time) {
                await this.purchaseOfferService.setNoMatch(purchaseOffer);
            }
        }
    }

    /**
     * Finzaliza las subastas desde el CronJob
     * 
     * @param id 
     * @returns 
     */
    finish = async (id: any) => {
        const auction = await this.repository.getById(id);
        if (auction === null)
            throw new Error("No se encontró la subasta");

        if (auction.status !== AuctionStatus.CREATED)
            throw new Error("La subasta no se encuentra activa.");

        // Update auction status.
        auction.status = AuctionStatus.EXECUTED;
        await this.repository.update(auction);
        await this.finishAuctionNew(auction.user, auction);
        return {};
    }

    finishAuction = async (id: any) => {
        let auction = await this.repository.getById(id);
        if (auction === null)
            throw new Error("No se encontró la subasta");

        // // Finish purchase options.
        // for (let i = 0; i < auction.purchaseOffers.length; i++) {
        //     let purchaseOffer = auction.purchaseOffers[i];
        //     purchaseOffer.status = PurchaseOfferStatus.FINISHED;
        //     await this.purchaseOfferService.update(purchaseOffer);
        // }

        auction.status = AuctionStatus.FINISHED;
        auction = await this.repository.update(auction);
        return auction;
    }

    /**
     * Create a purchase offer.
     * 
     * @param user 
     * @param purchaseOfferDto 
     * @returns 
     */
    purchaseOffer = async (user: any, purchaseOfferDto: any) => {

        // TODO: Validar que el usuario solo puede tener una compra.
        const purchaseOffers = await this.purchaseOfferService.getAllActiveByUser(user);
        if (purchaseOffers.length > 0)
            throw new Error(getText(TextType.ONLY_ONE_PURCHASE));

        const amountToWithdraw = purchaseOfferDto.amount * purchaseOfferDto.exchangeRate;

        // await this.withdraw(user, amountToWithdraw);
        if (user.balance < amountToWithdraw) {
            // Send notification.        
            this.notificationService.sendNotifications(
                user,
                getText(TextType.TRANSACTION_ERROR),
                `${getText(TextType.WITHOUT_FUNDS)} ${formatCurrency(user.balance)}`,
                {}
            );
            throw new Error(`${getText(TextType.WITHOUT_FUNDS)} ${formatCurrency(user.balance)}`);
        }

        // TODO: Save transaction.
        user.balance -= amountToWithdraw;
        user.balance = user.balance.toFixed(4);
        await this.userService.update(user);

        // Send notification to buyer.        
        this.notificationService.sendNotifications(
            user,
            getText(TextType.TRANSACTION_SUCCESS),
            ` `,
            {}
        );

        // Platform utility.
        const utility = this.platformUtility(purchaseOfferDto.amount);
        const exchangeRate = purchaseOfferDto.exchangeRate - utility;
        purchaseOfferDto.exchangeRateBase = purchaseOfferDto.exchangeRate.toFixed(4);
        purchaseOfferDto.exchangeRate = exchangeRate.toFixed(4);

        let auction;
        let auctions = await this.repository.getAvailable(purchaseOfferDto.exchangeRate);

        let status = PurchaseOfferStatus.CREATED;
        let isAsigned = false;

        if (auctions.length > 0) {
            auctions.forEach((auctionDb: any) => {
                const dif = auctionDb.amount - auctionDb.accumulated;
                if (dif >= purchaseOfferDto.amount && !isAsigned && (auctionDb.user.toString() !== user._id.toString())) {
                    status = PurchaseOfferStatus.EXECUTED;
                    isAsigned = true;
                    auction = auctionDb;
                }
            });
        }

        const offer = await this.purchaseOfferService.create({
            ...purchaseOfferDto,
            status,
            user
        });

        // Assign purchase offer to auction.
        if (auction !== undefined) {
            const dif = auction.amount - auction.accumulated;
            if (dif >= purchaseOfferDto.amount) {
                let accumulated = auction.accumulated + purchaseOfferDto.amount;
                auction.accumulated = accumulated.toFixed(4);
                auction.purchaseOffers.push(offer);
                if (auction.accumulated === auction.amount) {
                    await this.finishPurchases(auction);
                    auction.status = AuctionStatus.EXECUTED;
                }
                await this.repository.update(auction);
            }

            if (auction.accumulated === auction.amount) {
                await this.finishAuctionNew(auction.user, auction);
            }
        }

        // TODO: Asign to auction.

        offer.user = undefined;
        return offer;
    }

    private finishAuctionNew = async (user: any, auction: any) => {

        if(user.deviceToken === undefined)
            user = await this.userService.getById(user);        
        
        await this.sendMoneyToSeller(auction);        
        await this.sendMoneyToBuyers(auction);

        // Save transaction.
        await this.transactionService.createTransaction(TransactionType.SALE, user, auction.amount, CurrencyType.USD, 0, JSON.stringify(auction));

        // Send notification.        
        this.notificationService.sendNotifications(
            user,
            getText(TextType.AUCTION_CLOSE),
            ` `,
            {}
        );
    }

    private finishPurchases = async (auction: any) => {
        for (let i = 0; i < auction.purchaseOffers.length; i++) {
            let purchaseOffer = auction.purchaseOffers[i];
            purchaseOffer.status = PurchaseOfferStatus.EXECUTED;
            purchaseOffer = await this.purchaseOfferService.update(purchaseOffer);

            // Save transaction.
            await this.transactionService.createTransaction(TransactionType.BUY, purchaseOffer.user, purchaseOffer.amount, CurrencyType.USD, 0, JSON.stringify(purchaseOffer));
        }
    }

    private sendMoneyToSeller = async (auction: any) => {

        const auctionDb = await this.repository.getById(auction._id);
        if (auctionDb === null)
            throw new Error("No se encontró la subasta");

        // Deposit amount MXN to seller.
        let seller = await this.userService.getById(auctionDb.user);
        let amount = 0;
        auctionDb.purchaseOffers.forEach((purchaseOffer: any) => {
            amount += (purchaseOffer.amount * purchaseOffer.exchangeRate);
        });
        const balance = seller.balance + amount;
        seller.balance = balance.toFixed(4);
        const balanceUSD = seller.balanceUSD + (auctionDb.amount - auctionDb.accumulated);
        seller.balanceUSD = balanceUSD.toFixed(4); // Return USD.
        await this.userService.update(seller);
    }

    private sendMoneyToBuyers = async (auction: any) => {

        const auctionDb = await this.repository.getById(auction._id);
        if (auctionDb === null)
            throw new Error("No se encontró la subasta");

        // Deposit amount to buyers.
        for (let i = 0; i < auctionDb.purchaseOffers.length; i++) {
            const purchaseOffer = auctionDb.purchaseOffers[i];
            let user = await this.userService.getById(purchaseOffer.user._id);
            let balanceUSD = user.balanceUSD + purchaseOffer.amount;
            user.balanceUSD = balanceUSD.toFixed(4);
            await this.userService.update(user);
        }
    }

    /**
     * Comisión de acuerdo a la cantidad de dolares a comprar.
     * 
     * @param amount 
     * @returns 
     */
    private platformUtility(amount: any) {
        let commission = 0.05;
        if (amount > 0 && amount <= 1000) {
            commission = 0.05;
        } else if (amount > 1000 && amount <= 5000) {
            commission = 0.035;
        } else if (amount > 5000 && amount <= 50000) {
            commission = 0.02;
        } else if (amount > 50000 && amount <= 100000) {
            commission = 0.001;
        } else if (amount > 100000 && amount <= 500000) {
            commission = 0.005;
        } else if (amount > 500000 && amount <= 1000000) {
            commission = 0.0025;
        } else if (amount > 1000000) {
            commission = 0.001;
        }
        return commission;
    }

    // CMS
    getAll = async () => {
        return this.repository.getAll();
    }
}

export default AuctionService;
