import * as express from 'express';
import Role from '../enums/Role';
import authMiddleware from '../middleware/auth.middleware';
import ExchangeRateService from '../services/ExchangeRateService';
import BadRequestException from '../exceptions/BadRequestException';
import BaseController from './base/BaseController';

class ExchangeRateController extends BaseController<ExchangeRateService> {

    private allUsers = [Role.PERSONA_FISICA, Role.PERSONA_MORAL];

    public path = '/exchangeRates';
    public router = express.Router();

    // private exchangeRateService = new ExchangeRateService();

    constructor() {
        super(new ExchangeRateService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.get(this.path, await authMiddleware(this.allUsers), this.get);
        // CMS
        this.router.get(`${this.path}/cms`, await authMiddleware([Role.ADMIN]), this.getAll);
        this.router.post(`${this.path}/cms`, await authMiddleware([Role.ADMIN]), this.create);
        this.router.put(`${this.path}/cms`, await authMiddleware([Role.ADMIN]), this.update);
        this.router.put(`${this.path}/cms/activate`, await authMiddleware([Role.ADMIN]), this.activate);
        this.router.put(`${this.path}/cms/deactivate`, await authMiddleware([Role.ADMIN]), this.deactivate);
        this.router.delete(`${this.path}/cms/delete`, await authMiddleware([Role.ADMIN]), this.delete);
    }

    private get = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const res = await this.service.get();
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    // CMS
    getAll = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const res = await this.service.getAll();
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
    
    create = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const data = request.body;
            const res = await this.service.create(data);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    update = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const data = request.body;
            const res = await this.service.update(data);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    activate = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const data = request.body;
            const res = await this.service.activate(data);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    deactivate = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const data = request.body;
            const res = await this.service.deactivate(data);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    delete = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const data = request.body;
            const res = await this.service.delete(data);
            response.send({status:'ok'});
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
}

export default ExchangeRateController;
