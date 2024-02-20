import * as express from 'express';
import HttpException from '../exceptions/HttpException';
import validationMiddleware from '../middleware/validation.middleware';
import BaseController from './base/BaseController';
import LoginDto from '../dto/LoginDto';
import UserService from '../services/UserService';
import BadRequestException from '../exceptions/BadRequestException';
import RegisterWithEmailDto from '../dto/RegisterWithEmailDto';
import RegisterWithPhoneDto from '../dto/RegisterWithPhoneDto';
import Role from '../enums/Role';
import authMiddleware from '../middleware/auth.middleware';
import LoginPhoneDto from '../dto/LoginPhoneDto';
import UploadINEDto from '../dto/UploadINEDto';
import TransactionService from '../services/TransactionService';
import InvoiceService from '../services/InvoiceService';
import ResetPasswordDto from '../dto/ResetPasswordDto';
import TransactionType from '../enums/TransactionType';
import AdministratorDto from '../dto/AdministratorDto';
import RecoverPasswordDto from '../dto/RecoverPasswordDto';

class UserController extends BaseController<UserService> {

    public path = '/users';
    public router = express.Router();
    private usersRols = [Role.PERSONA_FISICA, Role.PERSONA_MORAL];

    private invoiceService = new InvoiceService();
    private transactionService = new TransactionService();

    constructor() {
        super(new UserService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.post(`${this.path}/registerWithEmail`, validationMiddleware(RegisterWithEmailDto), this.registerWithEmail);
        this.router.post(`${this.path}/registerWithPhone`, validationMiddleware(RegisterWithPhoneDto), this.registerWithPhone);
        this.router.post(`${this.path}/login`, validationMiddleware(LoginDto), this.login);
        this.router.post(`${this.path}/loginPhone`, validationMiddleware(LoginPhoneDto), this.loginPhone);
        this.router.post(`${this.path}/recoverPassword`, validationMiddleware(RecoverPasswordDto), this.recoverPassword);
        this.router.post(`${this.path}/setPassword`, this.setPassword);
        this.router.post(`${this.path}/resetPassword`, await authMiddleware(this.usersRols), validationMiddleware(ResetPasswordDto), this.resetPassword);
        this.router.get(`${this.path}/generateUsername`, await authMiddleware(this.usersRols, false), this.generateUsername);
        this.router.post(`${this.path}/verifyIdDocument`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL, Role.ADMIN], false), this.verifyIdDocument);
        this.router.put(`${this.path}/:id`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL, Role.ADMIN], false), this.update);
        this.router.delete(`${this.path}/:id`, this.delete); // TODO: TEMP DEVELOP
        this.router.get(`${this.path}/me`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL]), this.me);
        this.router.get(`${this.path}/:id/notifications`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL]), this.getAllNotifications);
        this.router.put(`${this.path}/:id/notifications/:notificationId/setIsRead`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL]), this.setIsRead);
        this.router.delete(`${this.path}/:id/notifications/:notificationId`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL]), this.deleteNotification);
        this.router.put(`${this.path}/:id/updateDeviceToken`, await authMiddleware(this.usersRols), this.updateDeviceToken); // TODO: TEMP DEVELOPMENT
        this.router.put(`${this.path}/:id/addFunds`, await authMiddleware(this.usersRols), this.addFunds); // TODO: TEMP DEVELOPMENT
        this.router.put(`${this.path}/:id/whitdrawFundsMXN`, await authMiddleware(this.usersRols), this.whitdrawFundsMXN); // TODO: TEMP DEVELOPMENT
        this.router.put(`${this.path}/:id/addFundsUSD`, await authMiddleware(this.usersRols), this.addFundsUSD); // TODO: TEMP DEVELOPMENT
        this.router.put(`${this.path}/:id/whitdrawFundsUSD`, await authMiddleware(this.usersRols), this.whitdrawFundsUSD); // TODO: TEMP DEVELOPMENT
        this.router.get(`${this.path}/:id/getBalance`, await authMiddleware(this.usersRols), this.getBalance); // TODO: TEMP DEVELOPMENT
        this.router.get(`${this.path}/:id/getMovements`, await authMiddleware(this.usersRols), this.getMovements);
        this.router.get(`${this.path}/:id/getInvoices`, await authMiddleware(this.usersRols), this.getInvoices);
        this.router.post(`${this.path}/:id/administrators`, await authMiddleware([Role.PERSONA_MORAL]), validationMiddleware(AdministratorDto), this.addAdministrator);
        this.router.put(`${this.path}/:id/administrators/:idAdministrator`, await authMiddleware(this.usersRols, false), validationMiddleware(UploadINEDto), this.uploadINE);
        this.router.put(`${this.path}/:id/administrators/:idAdministrator/setINEVerify`, await authMiddleware(this.usersRols, false), this.setINEVerify); // TODO: Review security
        this.router.delete(`${this.path}/:id/administrators/:idAdministrator`, await authMiddleware([Role.PERSONA_MORAL]), this.deleteAdministrator);
        this.router.post(`${this.path}/:id/verifyPin`, await authMiddleware(this.usersRols, false), this.verifyPin);

        // APP-CMS
        this.router.get(`${this.path}/getAllUsersForCMS`,this.getAllUsersCMS); //Gets all trasmisora users for CMS
        this.router.post(`${this.path}/loginFromCMS`, this.loginFromCMS); //Validates the received token and creates a local one to be used in CMS

        // CARD POMELO
        this.router.post(`${this.path}/:id/requestCard`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL], false), this.requestCard);
        this.router.put(`${this.path}/:id/cancelCard/:idCard`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL]), this.cancelCard);

        // UPDATE
        this.router.put(`${this.path}/:id/updatePersonalData`, await authMiddleware([Role.PERSONA_FISICA, Role.ADMIN]), this.updatePersonalData);
        this.router.put(`${this.path}/:id/updateDocuments`, await authMiddleware([Role.PERSONA_FISICA, Role.ADMIN]), this.updateDocuments);
        this.router.put(`${this.path}/:id/updateTaxInformation`, await authMiddleware([Role.PERSONA_MORAL, Role.ADMIN]), this.updateTaxInformation);
        this.router.put(`${this.path}/:id/updateFiles`, await authMiddleware([Role.PERSONA_MORAL, Role.ADMIN]), this.updateFiles);
        this.router.put(`${this.path}/:id/updateAvatar`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL, Role.ADMIN]), this.updateAvatar);
        this.router.put(`${this.path}/:id/updatePINRequest`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL, Role.ADMIN]), this.updatePINRequest);
        this.router.put(`${this.path}/:id/updatePIN`, await authMiddleware([Role.PERSONA_FISICA, Role.PERSONA_MORAL, Role.ADMIN]), this.updatePIN);

        // CMS
        this.router.post(`${this.path}`, await authMiddleware([Role.ADMIN]), this.createUserCMS);
        this.router.put(`${this.path}`, await authMiddleware([Role.ADMIN]), this.updateUserCMS);
        this.router.delete(`${this.path}`, await authMiddleware([Role.ADMIN]), this.deleteUserCMS);

        this.router.post(`${this.path}/cms/login`, this.loginAdmin);
        this.router.get(`${this.path}/admins`, await authMiddleware([Role.ADMIN]), this.getAllAdmins);
        this.router.put(`${this.path}/activate/:id`, await authMiddleware([Role.ADMIN]), this.activate);
        this.router.put(`${this.path}/deactivate/:id`, await authMiddleware([Role.ADMIN]), this.deactivate);
        this.router.get(`${this.path}/cms`, await authMiddleware([Role.ADMIN]), this.getAll);
        this.router.get(`${this.path}/cms/validateDocuments`, await authMiddleware([Role.ADMIN]), this.getAllValidateDocuments);
    }

    /**
     * Register whit an email.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private registerWithEmail = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            let registerWithEmailDto: RegisterWithEmailDto = request.body;
            registerWithEmailDto = await this.service.registerWithEmail(registerWithEmailDto);
            response.send(registerWithEmailDto);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    delete = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const id = request.params.id;
            await this.service.deleteUser(id);
            response.send({});
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Register whit a phone.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private registerWithPhone = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            let registerWithPhoneDto: RegisterWithPhoneDto = request.body;
            registerWithPhoneDto = await this.service.registerWithPhone(registerWithPhoneDto);
            response.send(registerWithPhoneDto);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Login whit email.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private login = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const logInData: LoginDto = request.body;
            const user = await this.service.login(logInData);
            response.send(user);
        } catch (e) {
            if (e.toString().includes('bloqueada') || e.toString().includes('blocked'))
                next(new HttpException(403, e.message));
            else
                next(new HttpException(400, e.message));
        }
    }

    /**
     * Login whit phone.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private loginPhone = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const logInData: LoginPhoneDto = request.body;
            const user = await this.service.loginPhone(logInData);
            response.send(user);
        } catch (e) {
            // await this.logRepository.create(e);
            next(new HttpException(400, e.message));
        }
    }

    private recoverPassword = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const recoverPasswordDto: RecoverPasswordDto = request.body;
            const resp = await this.service.recoverPassword(recoverPasswordDto);
            response.send(resp);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private setPassword = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const setPasswordDto = request.body;
            const resp = await this.service.setPassword(setPasswordDto);
            response.send(resp);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private resetPassword = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const resetPasswordDto: ResetPasswordDto = request.body;
            const resp = await this.service.resetPassword(user, resetPasswordDto);
            response.send(resp);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    /**
     * Update user data.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    update = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.updateData(user, data);
            response.send(user);
        }
        catch (e) {
            console.log(e);
            next(new BadRequestException(e.message));
        }
    }

    me = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            // user = await this.service.me(user);
            user.password = undefined;
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    getAllNotifications = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const notifications = await this.service.getAllNotifications(user);
            response.send(notifications);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    setIsRead = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const notificationId = request.params.notificationId;
            const notification = await this.service.setIsRead(user, notificationId);
            response.send(notification);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    deleteNotification = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const notificationId = request.params.notificationId;
            await this.service.deleteNotification(user, notificationId);
            response.send({ status: 'ok' });
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updateDeviceToken = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const { deviceToken }: any = request.body;
            user = await this.service.updateDeviceToken(user, deviceToken);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Add funds.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private addFunds = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.addFunds(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Whitdraw funds.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private whitdrawFundsMXN = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.whitdrawFundsMXN(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Add funds USD.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private addFundsUSD = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.addFundsUSD(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Whitdraw funds USD.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private whitdrawFundsUSD = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.whitdrawFundsUSD(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Get user balance.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private getBalance = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            response.send({
                balance: user.balance.toFixed(4),
                balanceUSD: user.balanceUSD.toFixed(4),
            });
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Get user movements.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private getMovements = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user: any = request.user;
            let transactions = await this.transactionService.getAllByUser(user);
            let language = request.headers["accept-language"];
            if (language !== undefined) {
                if (language !== 'en') {
                    var transactionsEs = [];
                    transactions.forEach((transaction: any) => {
                        transaction.type = this.translateCaption(transaction.type);
                        transactionsEs.push(transaction);
                    });
                    transactions = transactionsEs
                }
            }
            response.send(transactions);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    private translateCaption = (type: TransactionType) => {
        var translate = '';
        switch (type) {
            case TransactionType.DEPOSIT:
                translate = 'DEPOSITO';
                break;
            case TransactionType.WITHDRAWAL:
                translate = 'RETIRO';
                break;
            case TransactionType.BUY:
                translate = 'COMPRA';
                break;
            case TransactionType.SALE:
                translate = 'VENTA';
                break;
            case TransactionType.REFUND_BUY:
                translate = 'REEMBOLSO_COMPRA';
                break;
            case TransactionType.REFUND_SALE:
                translate = 'REEMBOLSO_VENTA';
                break;
            default:
                translate = type;
        }
        return translate;
    }

    /**
     * Get user invoices.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private getInvoices = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user: any = request.user;
            const invoices = await this.invoiceService.getAllByUser(user);
            response.send(invoices);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    /**
     * Generate username.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private generateUsername = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const userName = await this.service.generateUsername();
            response.send({ "userName": userName });
        } catch (e) {
            // await this.logRepository.create(e);
            next(new HttpException(400, e.message));
        }
    }

    /**
     * Verify document.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private verifyIdDocument = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const body = request.body;
            const user = request.user;

            let status = await this.service.verifyIdDocument(body.uuid);
            if (status === 'Checked') {
                status = await this.service.getResults(body.uuid);

                let docValue = 'OCR Number';
                if (status.documentType !== 'VOTING_CARD')
                    docValue = 'Document Number';

                const docNumber = status.documentData.find((x: any) => x.type === docValue);

                user.identificationType = status.documentType;
                user.identificationNumber = docNumber.value;
                await this.service.update(user);

                response.send({ "status": status.globalResult });
            }
            else {
                response.send({ "status": status });
            }
        } catch (e) {
            // await this.logRepository.create(e);
            next(new HttpException(400, e.message));
        }
    }

    /**
     * Upload INE.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private uploadINE = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const uploadINEDto: UploadINEDto = request.body;
            const idAdministrator: string = request.params.idAdministrator;
            const ine = await this.service.setINEAdministrator(idAdministrator, uploadINEDto);
            response.send(ine);
        } catch (e) {
            // await this.logRepository.create(e);
            next(new HttpException(400, e.message));
        }
    }

    /**
     * Set INE as verify.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private setINEVerify = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const idAdministrator: string = request.params.idAdministrator;
            const ine = await this.service.setINEVerify(idAdministrator);
            response.send(ine);
        } catch (e) {
            // await this.logRepository.create(e);
            next(new HttpException(400, e.message));
        }
    }

    private addAdministrator = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            let administratodDto: any = request.body;
            administratodDto = await this.service.addAdministrator(user, administratodDto);
            response.send(administratodDto);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private deleteAdministrator = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const idAdministrator: string = request.params.idAdministrator;
            await this.service.deleteAdministrator(user, idAdministrator);
            response.send({ status: "ok" });
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    /**
     * Verify PIN.
     * 
     * @param request 
     * @param response 
     * @param next 
     */
    private verifyPin = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const user = request.user;
            const { pinCode } = request.body;

            const isVerify = await this.service.verifyPin(user, pinCode);
            response.send({ isVerify: isVerify });
        } catch (e) {
            // await this.logRepository.create(e);
            next(new HttpException(400, e.message));
        }
    }

    // AUTH CMS
    // Creates a local token to be used in CMS
    private loginFromCMS = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            const sender = request.headers.host;
            const userName = request.body.user;
            const val = await this.service.loginFromCMS(sender, userName);
            response.send(val);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    // USERS APP-CMS
    private getAllUsersCMS = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try{
            const users = await this.service.getAllUsersForCMS();
            response.send(users);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    // CMS

    private createUserCMS = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            let user = request.body;
            user = await this.service.createUserCMS(user);
            response.send(user);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private updateUserCMS = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            let user = request.body;
            user = await this.service.updateUserCMS(user);
            response.send(user);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private deleteUserCMS = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            let user = request.body;
            user = await this.service.deleteUserCMS(user);
            response.send(user);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    /**
     * Login CMS.
     * @param request 
     * @param response 
     * @param next 
     */
    private loginAdmin = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const logInData: LoginDto = request.body;
            const user = await this.service.loginAdmin(logInData);
            response.send(user);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private getAllAdmins = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const users = await this.service.getAllAdmins();
            response.send(users);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private activate = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const userId = request.params.id;
            const user = await this.service.activate(userId);
            response.send(user);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    private deactivate = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const userId = request.params.id;
            const user = await this.service.deactivate(userId);
            response.send(user);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    getAllValidateDocuments = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const users = await this.service.getAllValidateDocuments();
            response.send(users);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    getAll = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const users = await this.service.getAll();
            response.send(users);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    // CARD POMELO
    private requestCard = async (request: any, response: any, next: express.NextFunction) => {
        try {
            const user = request.user;
            const res = await this.service.requestCard(user);
            response.send(res);
        } catch (e) {
            console.log(e);
            next(new HttpException(400, e.message));
        }
    }

    private cancelCard = async (request: any, response: any, next: express.NextFunction) => {
        try {
            const user = request.user;
            const idCard = request.params.idCard;
            const res = await this.service.cancelCard(user, idCard);
            response.send(res);
        } catch (e) {
            next(new HttpException(400, e.message));
        }
    }

    // UPDATE
    updatePersonalData = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.updatePersonalData(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updateDocuments = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            let res = await this.service.updateDocuments(user, data);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updateTaxInformation = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.updateTaxInformation(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updateFiles = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            let res = await this.service.updateFiles(user, data);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updateAvatar = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const data: any = request.body;
            user = await this.service.updateAvatar(user, data);
            response.send(user);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updatePINRequest = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const { pin }: any = request.body;
            await this.service.updatePINRequest(user, pin);
            response.send({ status: 'ok' });
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }

    updatePIN = async (request: any, response: express.Response, next: express.NextFunction) => {
        try {
            let user: any = request.user;
            const { code, pin }: any = request.body;
          
            const change = await this.service.updatePIN(user, { code }, pin);
            if(change){
                response.send({ status: change ? 'ok' : 'error' });
            }else{
                next(new BadRequestException("error"));
            }
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
}

export default UserController;
