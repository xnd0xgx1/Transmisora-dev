import * as express from 'express';
import BaseController from './base/BaseController';
import BadRequestException from '../exceptions/BadRequestException';
import Role from '../enums/Role';
import authMiddleware from '../middleware/auth.middleware';
import DeviceService from '../services/DeviceService';
import UserService from '../services/UserService';
import validationMiddleware from '../middleware/validation.middleware';
import VerificationDeviceDto from '../dto/VerificationDeviceDto';

class DeviceController extends BaseController<DeviceService> {

    public path = '/users/:userId/devices';
    public router = express.Router();
    private allUsers = [Role.PERSONA_FISICA, Role.PERSONA_MORAL];

    constructor() {
        super(new DeviceService(new UserService()));
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(`${this.path}`, await authMiddleware(this.allUsers, false), validationMiddleware(VerificationDeviceDto), this.addDevice);
        this.router.post(`${this.path}/:deviceId/resendVerifyCode`, await authMiddleware(this.allUsers, false), this.resendVerifyCode);
        this.router.put(`${this.path}/:deviceId/verifyDevice`, await authMiddleware(this.allUsers, false), this.verifyDevice);        
        this.router.put(`${this.path}/:deviceId`, await authMiddleware(this.allUsers, false), this.update);
        this.router.put(`${this.path}/:deviceId/startSession`, await authMiddleware(this.allUsers, false), this.startSession);
        this.router.put(`${this.path}/:deviceId/finishSession`, await authMiddleware(this.allUsers), this.finishSession);
        this.router.post(`${this.path}/closeAllSessions`, await authMiddleware(this.allUsers), this.closeAllSessions);
    }

    addDevice = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            let device: any = request.body;
            device = await this.service.addDevice(user, device);
            response.send(device);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    resendVerifyCode = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const device: any = request.body;
            const deviceId = request.params.deviceId;
            // TODO: Verificar si el dispositivo es del usuario.            
            await this.service.resendVerifyCode(user, device, deviceId);
            response.send({status:"ok"});
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    verifyDevice = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const deviceId = request.params.deviceId;
            let { verifyCode }: any = request.body;
            let device = await this.service.verifyDevice(user, deviceId, verifyCode);
            response.send(device);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    update = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const deviceId = request.params.deviceId;
            let device: any = request.body;
            device = await this.service.updateDevice(user, deviceId, device);
            response.send(device);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    startSession = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const deviceId = request.params.deviceId;
            let session = await this.service.startSession(user, deviceId);
            response.send(session);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    finishSession = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const deviceId = request.params.deviceId;
            let session = await this.service.finishSession(user, deviceId);
            response.send(session);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    closeAllSessions = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const device = request.device;
            await this.service.closeAllSessions(user, device);
            response.send({ status: 'ok' });
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
}

export default DeviceController;
