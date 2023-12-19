import * as express from 'express';
import BaseController from './base/BaseController';
import BadRequestException from '../exceptions/BadRequestException';
import Role from '../enums/Role';
import authMiddleware from '../middleware/auth.middleware';
import AuctionService from '../services/AuctionService';
import validationMiddleware from '../middleware/validation.middleware';
import PurchaseOfferDto from '../dto/PurchaseOfferDto';
import CreateAuctionDto from '../dto/CreateAuctionDto';
import PurchaseOfferService from '../services/PurchaseOfferService';
import TransactionService from '../services/TransactionService';

class AuctionController extends BaseController<AuctionService> {

    public path = '/auctions';
    public router = express.Router();
    private allUsers = [Role.PERSONA_FISICA, Role.PERSONA_MORAL];

    private purchaseOfferService = new PurchaseOfferService();
    private transactionService = new TransactionService();

    constructor() {
        super(new AuctionService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(`${this.path}`, await authMiddleware(this.allUsers), validationMiddleware(CreateAuctionDto), this.createAuction);
        this.router.get(`${this.path}/:id`, await authMiddleware(this.allUsers), this.getById); // TODO: WILL OVERIDE???        
        this.router.put(`${this.path}/:id`, await authMiddleware(this.allUsers), this.finish); // TODO: DEVELOPMENT DELTE??
        this.router.put(`${this.path}/:id/finish`, await authMiddleware(this.allUsers), this.finishAuction); // TODO: DEVELOPMENT DELTE??        
        this.router.post(`${this.path}/purchaseOffer`, await authMiddleware(this.allUsers), validationMiddleware(PurchaseOfferDto), this.purchaseOffer);
        this.router.get(`${this.path}/purchaseOffer/:id`, await authMiddleware(this.allUsers), this.getByPurchaseOffersId);
        this.router.put(`${this.path}/purchaseOffer/:id/finish`, await authMiddleware(this.allUsers), this.finishPurchaseOffer);
        this.router.post(`${this.path}/purchaseOffer/:id/getTicket`, await authMiddleware(this.allUsers), this.getTicket);
        this.router.post(`${this.path}/purchaseOffer/:id/getCFDIPdf`, await authMiddleware(this.allUsers), this.getCFDIPdf);
        this.router.post(`${this.path}/purchaseOffer/:id/getInvoice`, await authMiddleware(this.allUsers), this.getInvoice);

        // CMS
        this.router.get(`${this.path}/cms/all`, await authMiddleware([Role.ADMIN]), this.getAll);
        this.router.get(`${this.path}/cms/transactions`, await authMiddleware([Role.ADMIN]), this.getAllTransactions);
    }

    /**
     * Create an auction.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private createAuction = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const createAuctionDto: CreateAuctionDto = request.body;
            const auction = await this.service.createAuction(user, createAuctionDto);
            response.send(auction);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    getById = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const id = request.params.id;
            const auction = await this.service.getById(id);
            response.send(auction);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Create a purchase offer.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private purchaseOffer = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const purchaseOfferDto: PurchaseOfferDto = request.body;
            const offer = await this.service.purchaseOffer(user, purchaseOfferDto);
            response.send(offer);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getByPurchaseOffersId = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const id = request.params.id;
            const purchaseOffer = await this.service.getByPurchaseOffersId(id);
            if (purchaseOffer === undefined)
                throw new Error("No se encontró la oferta de compra");

            // TODO: Verify if has permissions
            response.send(purchaseOffer);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private finish = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const id = request.params.id;
            // const offer = await this.service.finish(id);
            response.send({});
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private finishAuction = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const id = request.params.id;
            const auction = await this.service.finishAuction(id);
            response.send(auction);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private finishPurchaseOffer = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const id = request.params.id;
            const offer = await this.purchaseOfferService.finish(user, id);
            response.send(offer);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getTicket = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const id = request.params.id;
            const pdf = await this.purchaseOfferService.getTicket(user, id);
            response.send(pdf);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getCFDIPdf = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const id = request.params.id;
            const pdf = await this.purchaseOfferService.getCFDIPdf(user, id);
            response.send(pdf);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getInvoice = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const id = request.params.id;
            const pdf = await this.purchaseOfferService.getInvoice(user, id);
            response.send(pdf);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    getAll = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const auctions = await this.service.getAll();
            response.send(auctions);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
    
    private getAllTransactions = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const transactions = await this.transactionService.getAll();
            response.send(transactions);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
}

export default AuctionController;
