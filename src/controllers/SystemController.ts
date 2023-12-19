import * as express from 'express';
import BaseController from './base/BaseController';
import BadRequestException from '../exceptions/BadRequestException';
import Role from '../enums/Role';
import authMiddleware from '../middleware/auth.middleware';
import SystemService from '../services/SystemService';
import NotificationService from '../services/NotificationService';

class SystemController extends BaseController<SystemService> {

    public path = '/system';
    public router = express.Router();

    private notificationService = new NotificationService();

    constructor() {
        super(new SystemService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.get(`${this.path}`, await authMiddleware([Role.ADMIN], false), this.get);
        this.router.get(`${this.path}/settings/payment`, await authMiddleware([Role.ADMIN], false), this.getPayment);
        this.router.put(`${this.path}/settings/payment`, await authMiddleware([Role.ADMIN], false), this.setPayment);
        this.router.get(`${this.path}/settings/withdrawal`, await authMiddleware([Role.ADMIN], false), this.getWithdrawal);
        this.router.put(`${this.path}/settings/withdrawal`, await authMiddleware([Role.ADMIN], false), this.setWithdrawal);
        this.router.get(`${this.path}/settings/time`, await authMiddleware([Role.ADMIN], false), this.getTime);
        this.router.put(`${this.path}/settings/time`, await authMiddleware([Role.ADMIN], false), this.setTime);
        this.router.get(`${this.path}/notifications`, await authMiddleware([Role.ADMIN], false), this.getNotifications);
    }

    private get = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const system = await this.service.get();
            response.send(system);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getPayment = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const setting = await this.service.getPayment();
            response.send(setting);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private setPayment = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            let data = request.body;
            data.admin = user.email;
            const setting = await this.service.setPayment(data);
            response.send(setting);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getWithdrawal = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const setting = await this.service.getWithdrawal();
            response.send(setting);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private setWithdrawal = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            let data = request.body;
            data.admin = user.email;
            const setting = await this.service.setWithdrawal(data);
            response.send(setting);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getTime = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const setting = await this.service.getTime();
            response.send(setting);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private setTime = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            let data = request.body;
            data.admin = user.email;
            const setting = await this.service.setTime(data);
            response.send(setting);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private getNotifications = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const notifications = await this.notificationService.getAllSystem();
            response.send(notifications);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
}

export default SystemController;
