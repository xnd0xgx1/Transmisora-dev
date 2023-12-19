import * as express from 'express';
import HttpException from '../exceptions/HttpException';
import validationMiddleware from '../middleware/validation.middleware';
import BaseController from './base/BaseController';
import VerifyDto from '../dto/VerifyDto';
import VerifyService from '../services/VerifyService';
import VerifyRequestDto from '../dto/VerifyRequestDto';
import OtpType from '../enums/OtpType';

class VerifyController extends BaseController<VerifyService> {

    public path = '/verify';
    public router = express.Router();

    constructor() {
        super(new VerifyService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(`${this.path}/request`, validationMiddleware(VerifyRequestDto), this.request);
        this.router.post(this.path, validationMiddleware(VerifyDto), this.verify);
    }

    /**
     * Solicita la verificación de un email o teléfono.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private request = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const verifyRequestDto: VerifyRequestDto = request.body;
            await this.service.request(verifyRequestDto, OtpType.VERIFY_EMAIL_PASSWORD);
            response.send({ 'success': true });
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private verify = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const verifyDto: VerifyDto = request.body;
            const { _id } = await this.service.verify(verifyDto);
            response.send({ _id });
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }
}

export default VerifyController;
