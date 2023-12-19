import * as express from 'express';
import HttpException from '../exceptions/HttpException';
import validationMiddleware from '../middleware/validation.middleware';
import BaseController from './base/BaseController';
import VerifyDto from '../dto/VerifyDto';
import OtpService from '../services/OtpService';
import OtpDto from '../dto/OtpDto';
import OtpType from '../enums/OtpType';

class OtpController extends BaseController<OtpService> {

    public path = '/otp';
    public router = express.Router();

    constructor() {
        super(new OtpService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(`${this.path}/request`, validationMiddleware(OtpDto), this.request);
        this.router.post(`${this.path}/verify`, validationMiddleware(OtpDto), this.verify);
    }

    private request = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const otpDto: OtpDto = request.body;
            await this.service.request(OtpType.VERIFY_EMAIL_PASSWORD);
            response.send({ 'success': true });
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private verify = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const verifyDto: VerifyDto = request.body;
            await this.service.request(verifyDto.value);
            response.send({ 'success': true });
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }
}

export default OtpController;
