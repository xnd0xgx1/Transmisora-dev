import BaseService from "./base/BaseService";
import PurchaseOffer from "../models/PurchaseOffer";
import PurchaseOfferRepository from "../repositories/PurchaseOfferRepository";
import PurchaseOfferStatus from "../enums/PurchaseOfferStatus";
import BillingService from "./BillingService";
import UserService from "./UserService";
import UserRepository from "../repositories/UserRepository";
import User from "../models/User";
import AuctionRepository from "../repositories/AuctionRepository";
import Auction from "../models/Auction";
import InvoiceService from "./InvoiceService";
import NotificationService from "./NotificationService";
import { getText } from "../common/Utilities";
import TextType from "../enums/TextType";

class PurchaseOfferService extends BaseService<PurchaseOfferRepository> {

    private notificationService = new NotificationService();
    private billingService = new BillingService();
    private invoiceService = new InvoiceService();
    private userRepository = new UserRepository(User);

    constructor() {
        super(new PurchaseOfferRepository(PurchaseOffer));
    }

    /**
     * Get purchase offer between range.
     * 
     * @param from 
     * @param to 
     * @returns 
     */
    getBetweenRange = async (from: number, to: number) => {
        const purchaseOffers = await this.repository.getBetweenRange(from, to);
        return purchaseOffers;
    }

    getAllActive = async () => {
        const purchaseOffers = await this.repository.getAllActive();
        return purchaseOffers;
    }

    getAllActiveByUser = async (user: any) => {
        const purchaseOffers = await this.repository.getAllActiveByUser(user);
        return purchaseOffers;
    }

    setNoMatch = async (purchaseOffer: any) => {
        if (purchaseOffer.status === PurchaseOfferStatus.CREATED) {
            purchaseOffer.status = PurchaseOfferStatus.NO_MATCH;
            const purchaseOffers = await this.repository.update(purchaseOffer);
            // Return money to buyer.
            let user: any = await this.userRepository.getById(purchaseOffer.user);
            user.balance += purchaseOffers.amount * purchaseOffers.exchangeRateBase;
            await this.userRepository.update(user);
            return purchaseOffers;
        }
        else {
            return purchaseOffer;
        }
    }

    finish = async (user: any, id: any) => {
        let purchaseOffer = await this.repository.getById(id);
        if (purchaseOffer.status === PurchaseOfferStatus.CREATED)
            throw new Error("La subasta aún no ha finalizado");

        if (purchaseOffer.status === PurchaseOfferStatus.FINISHED)
            throw new Error("Ya haz finalizado esta compra");

        // Validate if the purchase offer belongs to the user.
        if (purchaseOffer.user._id.toString() !== user._id.toString())
            throw new Error("Esta compra pertenece a otro usuario");

        // // TODO: Transfer money to user.
        // user.balanceUSD += purchaseOffer.amount;
        // await this.userRepository.update(user);

        // // TODO: Transfer money to auction owner.
        // let auction:any = await this.auctionRepository.getByPurchaseOffersId(id);
        // let auctionOwner:any = await this.userRepository.getById(auction.user._id);
        // auctionOwner.balance += purchaseOffer.amount * purchaseOffer.exchangeRate;
        // await this.userRepository.update(auctionOwner);

        // TODO: Generate CFDI and save data to regenereate PDF.

        purchaseOffer.status = PurchaseOfferStatus.FINISHED;
        purchaseOffer = await this.repository.update(purchaseOffer);

        return purchaseOffer;
    }

    getCFDIPdf = async (user: any, id: any) => {
        let pdf = await this.billingService.getPdf();
        return pdf;
    }

    getTicket = async (user: any, id: any) => {
        let pdf = await this.billingService.getPdf();

        // Send notification.        
        this.notificationService.sendNotifications(
            user,
            getText(TextType.TICKET_GENERATED),
            ``,
            {}
        );

        return pdf;
    }

    getInvoice = async (user: any, id: any) => {
        let pdf = await this.billingService.getPdf();
        await this.invoiceService.createInvoice(user, 'Razón S.A de C.V', 'correo@gmail.com', JSON.stringify(pdf));

        // Send notification.        
        this.notificationService.sendNotifications(
            user,
            getText(TextType.INVOICE_GENERATED),
            ``,
            {}
        );

        return pdf;
    }
}

export default PurchaseOfferService;
