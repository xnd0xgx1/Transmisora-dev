import { MSG_EMAIL_ALREADY_REGISTERED, MSG_NOT_PERMITTED, MSG_PHONE_ALREADY_REGISTERED } from "../common/messages";
import User from "../models/User";
import UserRepository from "../repositories/UserRepository";
import BaseService from "./base/BaseService";
import * as bcrypt from 'bcrypt';
import LoginDto from "../dto/LoginDto";
import { SECRET, TOKEN_EXPIRES } from "../common/constants";
import * as jwt from 'jsonwebtoken';
import TokenData from "../interfaces/tokenData.interface";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import DataStoredInTokenCMS from "../interfaces/dataStoredInTokenCMS";
import Role from "../enums/Role";
import RegisterWithEmailDto from "../dto/RegisterWithEmailDto";
import RegisterWithPhoneDto from "../dto/RegisterWithPhoneDto";
import RegistrationStage from "../enums/RegistrationStage";
import VerifyService from "./VerifyService";
import AddressRepository from "../repositories/AddressRepository";
import Address from "../models/Address";
import AdministratorRepository from "../repositories/AdministratorRepository";
import Administrator from "../models/Administrator";
import KycService from "./KycService";
import { getMinutesPassed, getText, imageToBase64 } from "../common/Utilities";
import LoginPhoneDto from "../dto/LoginPhoneDto";
import AdministratorService from "./AdministratorService";
import UploadINEDto from "../dto/UploadINEDto";
import Auction from "../models/Auction";
import AuctionRepository from "../repositories/AuctionRepository";
import PurchaseOfferRepository from "../repositories/PurchaseOfferRepository";
import PurchaseOffer from "../models/PurchaseOffer";
import PurchaseOfferService from "./PurchaseOfferService";
import TextType from "../enums/TextType";
import TransactionService from "./TransactionService";
import TransactionType from "../enums/TransactionType";
import CurrencyType from "../enums/CurrencyType";
import NotificationService from "./NotificationService";
import PushType from "../enums/PushType";
import ResetPasswordDto from "../dto/ResetPasswordDto";
import DeviceService from "./DeviceService";
import RecoverPasswordDto from "../dto/RecoverPasswordDto";
import OtpType from "../enums/OtpType";
import CardService from "./CardService";
import PomeloService from "./PomeloService";
import moment from "moment";
import OtpService from "./OtpService";
import OtpRepository from "../repositories/OtpRepository";
import OTP from "../models/OTP";
import SystemService from "./SystemService";
import axios from 'axios';
import { URLSearchParams } from 'url';
import RegistersService from "./RegistersService";
import Registers, { Preregisters } from "../models/Registers";
import DictService from "./DictService";
import PreregistersService from "./PreregistersService";
import VerifyDto from "../dto/VerifyDto";


class UserService extends BaseService<UserRepository> {

    private administratorService = new AdministratorService();
    private auctionRepository = new AuctionRepository(Auction);
    private cardService = new CardService();
    private deviceService = new DeviceService(this);
    private verifyService = new VerifyService();
    private addressRepository = new AddressRepository(Address);
    private administratorRepository = new AdministratorRepository(Administrator);
    private notificationService = new NotificationService();
    private otpService = new OtpService();
    private pomeloService = new PomeloService();
    private purchaseOfferRepository = new PurchaseOfferRepository(PurchaseOffer);
    private purchaseOfferService = new PurchaseOfferService();
    private transactionService = new TransactionService();
    private kycService = new KycService();
    private systemservice = new SystemService();
    private registerService = new RegistersService();
    private dictService = new DictService();
    private preregisgterService = new PreregistersService();

    private affinity_group_id = "afg-2JBuRSkKIsLtD8KnfKpHCCVj9kw"; // TODO: move to .ENV

    constructor() {
        super(new UserRepository(User));
    }

    deleteUser = async (id: any) => {

        let userDb = await this.repository.getById(id);
        if (userDb === null)
            throw new Error(getText(TextType.USER_NOT_FOUND));

        let value = undefined;

        if (userDb.email !== undefined)
            value = await this.verifyService.getByValue(userDb.email);
        else
            value = await this.verifyService.getByValue(`${userDb.phoneCode}${userDb.phone}`);

        if (value !== null)
            await this.verifyService.delete(value._id);

        await this.repository.delete(userDb._id);

    }

    registerWithEmail = async (registerWithEmailDto: RegisterWithEmailDto) => {

        let userDb = await this.repository.getByEmail(registerWithEmailDto.email);
        if (userDb !== null)
            throw new Error(MSG_EMAIL_ALREADY_REGISTERED);

        // Verifica si el email o teléfono ha sido verificado.
        const verify = await this.verifyService.getById(registerWithEmailDto.verify._id);
        if (verify === null)
            throw new Error('MSG_EMAIL_ALREADY_REGISTERED');

        // TODO: Validar si existen los catálogos.        

        const hashedPassword = await bcrypt.hash(registerWithEmailDto.password, 10);
        userDb = await this.repository.create({
            ...registerWithEmailDto,
            password: hashedPassword,
            roles: [registerWithEmailDto.roles.includes(Role.PERSONA_FISICA) ? Role.PERSONA_FISICA : Role.PERSONA_MORAL]
        });

        // // TODO: Enviar OTP.
        // this.optService.request(userDb, OTPType.VERIFY_ACCOUNT);

        const tokenData = this.createToken(userDb);
        const token = tokenData.token;

        return {
            ...userDb._doc,
            token
        };
    }

    registerWithPhone = async (registerWithPhoneDto: RegisterWithPhoneDto) => {

        let userDb = await this.repository.getByPhone(registerWithPhoneDto.phoneCode, registerWithPhoneDto.phone);
        if (userDb !== null)
            throw new Error(MSG_PHONE_ALREADY_REGISTERED);

        // Verifica si el email o teléfono ha sido verificado.
        const verify = await this.verifyService.getById(registerWithPhoneDto.verify._id);
        if (verify === null)
            throw new Error('MSG_EMAIL_ALREADY_REGISTERED');

        // if (verify.isVerified)
        //     throw new Error('Ya se ha utilizado esta verificación');

        // TODO: Validar si existen los catálogos.

        const hashedPassword = await bcrypt.hash(registerWithPhoneDto.password, 10);
        userDb = await this.repository.create({
            ...registerWithPhoneDto,
            password: hashedPassword,
            roles: [registerWithPhoneDto.roles.includes(Role.PERSONA_FISICA) ? Role.PERSONA_FISICA : Role.PERSONA_MORAL]
        });

        // // TODO: Enviar OTP.
        // this.optService.request(userDb, OTPType.VERIFY_ACCOUNT);
        const tokenData = this.createToken(userDb);
        const token = tokenData.token;

        return {
            ...userDb._doc,
            token
        };
    }

    login = async (loginDto: LoginDto) => {
        console.log("ENTER LOGIN");
        let userDb = await this.repository.getByEmail(loginDto.email);
        if (!userDb)
            throw new Error(getText(TextType.WRONG_ACCESS_DATA));

        console.log("USER BLOCKED");
        if (userDb.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));

        const isPasswordMatching = await bcrypt.compare(loginDto.password, userDb.password);
        if (!isPasswordMatching) {
            if (userDb.failedLoginAttempts === undefined)
                userDb.failedLoginAttempts = 0;
            userDb.failedLoginAttempts += 1;

            if (userDb.failedLoginAttempts > 5)
                userDb.isBlocked = true;
            this.repository.update(userDb);
            throw new Error(getText(TextType.WRONG_ACCESS_DATA));
        }

        userDb.failedLoginAttempts = 0;
        this.repository.update(userDb);

        // Get device.
        let isNewDevice = false;
        let device;
        let activeSessions = 0;
        let deviceDb = userDb.devices.find((x: any) => x.deviceToken === loginDto.deviceToken);
        activeSessions = await this.deviceService.getAllActiveSessions(userDb);
        if (deviceDb === undefined)
            isNewDevice = true;
        else {
            device = await this.deviceService.startSession(userDb, deviceDb._id);
            userDb = await this.repository.getByEmail(loginDto.email);
            
        }

        // Get pending auctions.
        const auctions = await this.auctionRepository.getAllByUserId(userDb._id);

        // Get pending purchase.
        let purchaseOffers: any = await this.purchaseOfferRepository.getAllByUser(userDb);
        if (purchaseOffers.length > 0) {
            const time = await this.systemservice.getTimePlatform();
            const purchaseOffer: any = purchaseOffers[0]; // Get last.
            const minutesPassed = getMinutesPassed(purchaseOffer.createdAt);
            if (minutesPassed >= time) {
                await this.purchaseOfferService.setNoMatch(purchaseOffer);
            }
        }

        userDb.password = undefined;
        const tokenData = this.createToken(userDb);
        const token = tokenData.token;

        return {
            ...userDb.toJSON(),
            auctions,
            purchaseOffers: purchaseOffers.length > 0 ? [purchaseOffers[0]] : [],
            token,
            isNewDevice,
            device,
            activeSessions
        }
    }

    loginPhone = async (loginPhoneDto: LoginPhoneDto) => {

        let userDb = await this.repository.getByPhone(loginPhoneDto.phoneCode, loginPhoneDto.phone);
        if (!userDb)
            throw new Error(getText(TextType.WRONG_ACCESS_DATA));

        const isPasswordMatching = await bcrypt.compare(loginPhoneDto.password, userDb.password);
        if (!isPasswordMatching)
            throw new Error(getText(TextType.WRONG_ACCESS_DATA));

        if (userDb.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));

        // Get device.
        let isNewDevice = false;
        let device;
        let activeSessions = 0;
        let deviceDb = userDb.devices.find((x: any) => x.deviceToken === loginPhoneDto.deviceToken);
        if (deviceDb === undefined)
            isNewDevice = true;
        else {
            device = await this.deviceService.startSession(userDb, deviceDb._id);
            userDb = await this.repository.getByPhone(loginPhoneDto.phoneCode, loginPhoneDto.phone);
            activeSessions = await this.deviceService.getAllActiveSessions(userDb);
        }

        // Get pending auctions.
        const auctions = await this.auctionRepository.getAllByUserId(userDb._id);

        // Get pending purchase.
        const purchaseOffers = await this.purchaseOfferRepository.getAllByUser(userDb);
        if (purchaseOffers.length > 0) {
            const time = await this.systemservice.getTimePlatform();
            const purchaseOffer: any = purchaseOffers[0]; // Get last.
            const minutesPassed = getMinutesPassed(purchaseOffer.createdAt);
            if (minutesPassed >= time) {
                await this.purchaseOfferService.setNoMatch(purchaseOffer);
            }
        }

        userDb.password = undefined;
        const tokenData = this.createToken(userDb);
        const token = tokenData.token;

        return {
            ...userDb.toJSON(),
            auctions,
            purchaseOffers: purchaseOffers.length > 0 ? [purchaseOffers[0]] : [],
            token,
            isNewDevice,
            device,
            activeSessions
        }
    }

    loginFromCMS = async (sender: string, userName: string, secretKey: string) => {
        // const allowedAddresses = ['localhost:4000', 'transmisoracmsback.azurewebsites', 'localhost:7109'];
        if (secretKey === '856f5dd984b5813c2f839dd1a2898485') {
            const tokenData = this.createTokenForCMSUser(userName);
            //Get the token from the tokenData
            const token = tokenData.token;
            return {
                userName,
                token
            }
        }
        else {
            throw new Error('No autorizado');
        }
    }

    recoverPassword = async (recoverPasswordDto: RecoverPasswordDto) => {

        if (recoverPasswordDto.email !== undefined) {
            const user = await this.repository.getByEmail(recoverPasswordDto.email);
            if (!user)
                throw new Error(getText(TextType.USER_NOT_FOUND));

            if (user.isBlocked)
                throw new Error(getText(TextType.BLOCKED_ACCOUNT));

            await this.verifyService.request({
                value: recoverPasswordDto.email
            }, OtpType.RECOVER_PASSWORD, user);
        }
        else {

            const user = await this.repository.getByPhone(recoverPasswordDto.phoneCode, recoverPasswordDto.phone);
            if (!user)
                throw new Error(getText(TextType.USER_NOT_FOUND));

            await this.verifyService.request({
                value: `${recoverPasswordDto.phoneCode}${recoverPasswordDto.phone}`
            }, OtpType.RECOVER_PASSWORD, user);
        }

        return { "status": "ok" }
    }
    verify = async (verifydto: VerifyDto) => {
        const { _id } = await this.verifyService.verify(verifydto);
        return { _id };
    }

    sendOTPs = async (recoverPasswordDto: RecoverPasswordDto) => {

        if (recoverPasswordDto.email !== undefined) {
            // const user = await this.repository.getByEmail(recoverPasswordDto.email);
            // if (!user)
            //     throw new Error(getText(TextType.USER_NOT_FOUND));

            // if (user.isBlocked)
            //     throw new Error(getText(TextType.BLOCKED_ACCOUNT));

            await this.verifyService.request({
                value: recoverPasswordDto.email
            }, OtpType.RECOVER_PASSWORD, recoverPasswordDto.email);
        }
        else {
            await this.verifyService.request({
                value: `${recoverPasswordDto.phoneCode}${recoverPasswordDto.phone}`
            }, OtpType.VERIFY, `${recoverPasswordDto.phoneCode}${recoverPasswordDto.phone}`);
        }

        return { "status": "ok" }
    }

    setPassword = async (setPasswordDto: any) => {

        let verify = await this.verifyService.getByValue(setPasswordDto.value);
        if (verify === null)
            throw new Error("El código ingresado es incorrecto 1");

        if (verify.otp.otpType !== OtpType.RECOVER_PASSWORD)
            throw new Error("El código ingresado es incorrecto 2");

        if (setPasswordDto.code !== verify.otp.code)
            throw new Error("El código ingresado es incorrecto 3");

        // TODO: Verificar el tiempo de validez del código.

        // TODO: Verificar intentos de uso.

        if (setPasswordDto.value.includes('@')) {
            if (setPasswordDto.value !== verify.otp.user.email)
                throw new Error("El código ingresado es incorrecto 4");
        }
        else {
            if (setPasswordDto.value !== `${verify.otp.user.phoneCode}${verify.otp.user.phone}`)
                throw new Error("El código ingresado es incorrecto 5");
        }

        let user = verify.otp.user;

        if (user.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));

        
        const isPasswordMatching = await bcrypt.compare(setPasswordDto.newPassword, user.password );
        if (isPasswordMatching)
            throw new Error(getText(TextType.SAME_PASS));
        
        const hashedPassword = await bcrypt.hash(setPasswordDto.newPassword, 10);
        user.password = hashedPassword;
        await this.update(user);

        verify.isVerified = true;
        verify.verifiedAt = new Date();
        await this.verifyService.update(verify);

        return { "status": "ok" }
    }

    resetPassword = async (user: any, resetPasswordDto: ResetPasswordDto) => {

        // if (user.pinCode !== resetPasswordDto.pinCode)
        //     throw new Error(getText(TextType.WRONG_VERIFICATION_CODE));

        if (user.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));

        const isPasswordMatching = await bcrypt.compare(resetPasswordDto.newPassword, user.password );
        if (isPasswordMatching)
            throw new Error(getText(TextType.SAME_PASS));
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
        user.password = hashedPassword;
        await this.update(user);

        return { "status": "ok" }
    }

    updateData = async (user: any, data: any) => {

        // En base al paso realizará la actualización de los datos del usuario.
        if (user.roles.includes(Role.PERSONA_FISICA)) {
            switch (user.RegistrationStage) {
                case RegistrationStage.INITIAL:
                    let {
                        firstName,
                        mothersLastName,
                        lastName,
                        emailSecondary,
                        gender,
                        birthdate,
                        countryOfBirth,
                        federalEntityOfBirth,
                        occupation,
                        curp,
                        address } = data;

                    // Validate required fields.
                    if (firstName === undefined || mothersLastName === undefined || emailSecondary === undefined || lastName === undefined || gender === undefined || birthdate === undefined ||
                        countryOfBirth === undefined || federalEntityOfBirth === undefined || occupation === undefined || address === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    // TODO: Validar existencia de catálogos.

                    // Register the address.
                    let arrAdress = [];
                    for (let k = 0; k < address.length; k++) {
                        let item = address[k];
                        item = await this.addressRepository.create(item);
                        arrAdress.push(item);
                    }

                    user.firstName = firstName;
                    user.mothersLastName = mothersLastName;
                    user.lastName = lastName;
                    user.emailSecondary = emailSecondary;
                    user.gender = gender;
                    user.birthdate = birthdate;
                    user.countryOfBirth = countryOfBirth;
                    user.federalEntityOfBirth = federalEntityOfBirth;
                    user.occupation = occupation;
                    user.curp = curp;
                    user.address = arrAdress;

                    user.RegistrationStage = RegistrationStage.PERSONAL_DATA

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.PERSONAL_DATA:
                    const {
                        avatar,
                        color,
                        userName } = data;

                    // TODO: Validar existencia de catálogos.

                    // Validate required fields.
                    if (avatar === undefined || color === undefined || userName === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    user.avatar = avatar;
                    user.color = color;
                    user.userName = userName;
                    user.RegistrationStage = RegistrationStage.AVATAR

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.AVATAR:
                    const {
                        ineFront,
                        ineBack,
                        passportFront,
                        passportBack,
                        isValidated } = data;

                    user.ineFront = ineFront;
                    user.ineBack = ineBack;
                    user.passportFront = passportFront;
                    user.passportBack = passportBack;

                    if (isValidated !== undefined) {
                        if (isValidated) {
                            user.RegistrationStage = RegistrationStage.DOCUMENTS;
                            user = await this.repository.update(user);
                            return { status: 'ok' };
                        }
                    }

                    // KYC.
                    let img1 = '';
                    let img2 = '';
                    if (ineFront !== undefined && ineBack !== undefined) {
                        img1 = await imageToBase64(ineFront._id);
                        img2 = await imageToBase64(ineBack._id);
                    }

                    // Passport
                    if (passportFront !== undefined) {
                        img1 = await imageToBase64(passportFront._id);
                    }

                    if (passportBack !== undefined) {
                        img2 = await imageToBase64(passportBack._id);
                    }

                    if (ineFront !== undefined) {
                        if (img1 === '' || img2 === '')
                            throw new Error('Todos los campos son requeridos.');
                    }
                    else {
                        if (img1 === '')
                            throw new Error('Todos los campos son requeridos.');
                    }

                    const res = await this.kycService.requestIdentityDocumentVerification(user._id, img1, img2);

                    // TODO: Almacena id de verificación.

                    // user.RegistrationStage = RegistrationStage.DOCUMENTS;
                    user = await this.repository.update(user);

                    return { 'uuid': res }
                case RegistrationStage.DOCUMENTS:
                    const {
                        signature } = data;

                    // TODO: Validar existencia de catálogos.

                    // Validate required fields.
                    if (signature === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    user.signature = signature;

                    user.RegistrationStage = RegistrationStage.SIGNATURE

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.SIGNATURE:
                    const {
                        pinCode } = data;

                    // TODO: Validar existencia de catálogos.

                    // Validate required fields.
                    if (pinCode === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    user.pinCode = pinCode;

                    user.RegistrationStage = RegistrationStage.PIN_CODE

                    user = await this.repository.update(user);
                    break;
                default:
                    break;
            }
        }
        else {
            // Persona Moral.
            switch (user.RegistrationStage) {
                case RegistrationStage.INITIAL:
                    let {
                        businessName,
                        businessLine,
                        rfc,
                        businessId,
                        countryOfAssignment,
                        electronicSignatureSeries,
                        businessAddress } = data;

                    // TODO: Validar existencia de catálogos.

                    // Validate required fields.
                    if (businessName === undefined || businessLine === undefined || rfc === undefined || businessId === undefined || countryOfAssignment === undefined ||
                        electronicSignatureSeries === undefined || businessAddress === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    // Register the address.
                    let arrAdress = [];
                    for (let k = 0; k < businessAddress.length; k++) {
                        let item = businessAddress[k];
                        item = await this.addressRepository.create(item);
                        arrAdress.push(item);
                    }

                    user.businessName = businessName;
                    user.businessLine = businessLine;
                    user.rfc = rfc;
                    user.businessId = businessId;
                    user.countryOfAssignment = countryOfAssignment;
                    user.electronicSignatureSeries = electronicSignatureSeries;
                    user.businessAddress = arrAdress;

                    user.RegistrationStage = RegistrationStage.TAX_INFO

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.TAX_INFO:
                    const { administrators } = data;

                    // TODO: Validar existencia de catálogos.

                    let arrAdministrators = [];
                    for (let k = 0; k < administrators.length; k++) {
                        let item = administrators[k];
                        item = await this.administratorRepository.create(item);
                        arrAdministrators.push(item);
                    }

                    // // Validate required fields.
                    // if (businessName === undefined || businessLine === undefined || rfc === undefined || businessId === undefined || countryOfAssignment === undefined ||
                    //     electronicSignatureSeries === undefined || businessAddress === undefined)
                    //     throw new Error('Todos los campos son requeridos.');

                    user.administrators = arrAdministrators;
                    user.RegistrationStage = RegistrationStage.ADMINISTRATORS

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.ADMINISTRATORS:
                    const {
                        avatar,
                        color,
                        userName } = data;

                    // TODO: Validar existencia de catálogos.

                    // Validate required fields.
                    if (avatar === undefined || color === undefined || userName === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    user.avatar = avatar;
                    user.color = color;
                    user.userName = userName;

                    user.RegistrationStage = RegistrationStage.AVATAR

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.AVATAR:
                    const { files, administratorsInes } = data;

                    // TODO: Validar existencia de catálogos.

                    // Validate required fields.
                    if (files === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    if (administratorsInes === undefined)
                        throw new Error('Los ines de los administradores son requeridos.');


                    for (let k = 0; k < administratorsInes.length; k++) {
                        let item = administratorsInes[k];
                        let administrator: any = await this.administratorRepository.getById(item._id);
                        // TODO: Validate if exist.

                        // Send to Veridoc.
                        let frontImage = await imageToBase64(item.ineFront._id);
                        let backImage = await imageToBase64(item.ineBack._id);

                        const res = await this.kycService.requestIdentityDocumentVerification(item._id, frontImage, backImage);

                        administrator.ineFront = item.ineFront._id;
                        administrator.ineBack = item.ineBack._id;
                        administrator.ineStatus = 'WaitingCheckin';
                        administrator.veridocId = res;

                        await this.administratorRepository.update(administrator);
                    }

                    user.files = files;
                    user.RegistrationStage = RegistrationStage.FILES

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.FILES:
                    const { signature } = data;

                    // TODO: Validar existencia de catálogos.

                    if (signature === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    user.signature = signature;

                    user.RegistrationStage = RegistrationStage.SIGNATURE

                    user = await this.repository.update(user);
                    break;
                case RegistrationStage.SIGNATURE:
                    const { pinCode } = data;

                    // TODO: Validar existencia de catálogos.

                    if (pinCode === undefined)
                        throw new Error('Todos los campos son requeridos.');

                    user.pinCode = pinCode;

                    user.RegistrationStage = RegistrationStage.PIN_CODE

                    user = await this.repository.update(user);
                    break;
                default:
                    break;
            }
        }

        return user;
    }

    me = async (user: any) => {
        return user;
    }

    getAllNotifications = async (user: any) => {
        return await this.notificationService.getAllByUser(user);
    }

    setIsRead = async (user: any, notificationId: string) => {
        // TODO: Validar si la notificación es del usuario.
        let notification: any = await this.notificationService.getById(notificationId);
        console.log(notification);
        notification.isRead = true;
        return await this.notificationService.update(notification);
    }

    deleteNotification = async (user: any, notificationId: string) => {
        // TODO: Validar si la notificación es del usuario.
        await this.notificationService.delete(notificationId);
    }

    updateDeviceToken = async (user: any, deviceToken: any) => {
        user.deviceToken = deviceToken;
        user = await this.repository.update(user);
        return user;
    }

    generateUsername = async () => {
        let usuarios: any;
        let random: string;
        do {
            let num = Math.floor(100000 + Math.random() * 900000)
            random = `Usuario${num}`
            usuarios = await this.repository.getByUserName(random);
        }
        while (usuarios != null);
        return random;
    }

    verifyIdDocument = async (uuid: string) => {
        return await this.kycService.requestIdentityDocumentVerificationStatus(uuid);
    }

    getResults = async (uuid: string) => {
        return await this.kycService.requestIdentityDocumentVerificationGetResults(uuid);
    }

    setINEAdministrator = async (administratorId: string, ine: UploadINEDto) => {

        // TODO: Validate user status before set INES.

        // Send INE TO Veridoc.
        // Passport

        let frontImage = await imageToBase64(ine.ineFront._id);
        let backImage = await imageToBase64(ine.ineBack._id);

        const res = await this.kycService.requestIdentityDocumentVerification(administratorId, frontImage, backImage);

        let administrator = await this.administratorService.getById(administratorId);
        administrator.ineFront = ine.ineFront;
        administrator.ineBack = ine.ineBack;
        administrator.ineStatus = 'WaitingChecking';
        administrator = await this.administratorService.update(administrator);

        return { 'uuid': res };
    }

    setINEVerify = async (administratorId: string) => {

        let administrator = await this.administratorService.getById(administratorId);
        administrator.ineStatus = 'Ok';
        administrator = await this.administratorService.update(administrator);

        return administrator;
    }

    addAdministrator = async (user: any, administratodDto: any) => {
        // TODO: Verify files.

        administratodDto = await this.administratorService.create(administratodDto);
        user.administrators.push(administratodDto);
        await this.repository.update(user);
        return administratodDto;
    }

    deleteAdministrator = async (user: any, administratorId: string) => {
        // TODO: Validar si es del usuario.
        await this.administratorService.delete(administratorId);
    }

    // TODO: TEMP DEVELOPMENT
    addFunds = async (user: any, data: any) => {
        user.balance = user.balance + data.amount;
        await this.repository.update(user);

        // Save transaction.
        await this.transactionService.createTransaction(TransactionType.DEPOSIT, user, data.amount, CurrencyType.MXN, 0, '{}');

        // Send notification.   
        const dataPush = {
            action: PushType.ADD_FUNDS
        };
        this.notificationService.sendNotifications(
            user,
            getText(TextType.ADD_FUNDS_TITLE),
            `${getText(TextType.ADD_FUNDS_DESCRIPTION)} ${data.amount}MXN`,
            dataPush
        );

        return user;
    }

    // TODO: TEMP DEVELOPMENT
    addFundsUSD = async (user: any, data: any) => {
        user.balanceUSD = user.balanceUSD + data.amount;
        await this.repository.update(user);

        // Save transaction.
        await this.transactionService.createTransaction(TransactionType.DEPOSIT, user, data.amount, CurrencyType.USD, 0, '{}');

        // Send notification.        
        const dataPush = {
            action: PushType.ADD_FUNDS
        };
        this.notificationService.sendNotifications(
            user,
            getText(TextType.ADD_FUNDS_TITLE),
            `${getText(TextType.ADD_FUNDS_DESCRIPTION)} ${data.amount}USD`,
            dataPush
        );

        return user;
    }

    whitdrawFundsMXN = async (user: any, data: any) => {

        if (user.balance < data.amount)
            throw new Error(getText(TextType.WITHOUT_FUNDS) + user.balance);

        user.balance = user.balance - data.amount;
        await this.repository.update(user);

        // Save transaction.
        await this.transactionService.createTransaction(TransactionType.WITHDRAWAL, user, data.amount, CurrencyType.MXN, 0, '{}');

        // Send notification.  
        const dataPush = {
            action: PushType.WHITDRAW_FUNDS
        };
        this.notificationService.sendNotifications(
            user,
            getText(TextType.WHITDRAW_FUNDS_TITLE),
            `${getText(TextType.WHITDRAW_FUNDS_DESCRIPTION)} ${data.amount}MXN`,
            dataPush
        );
        return user;
    }

    whitdrawFundsUSD = async (user: any, data: any) => {

        if (user.balanceUSD < data.amount)
            throw new Error(getText(TextType.WITHOUT_FUNDS) + user.balanceUSD);

        user.balanceUSD = user.balanceUSD - data.amount;
        await this.repository.update(user);

        // Save transaction.
        await this.transactionService.createTransaction(TransactionType.WITHDRAWAL, user, data.amount, CurrencyType.USD, 0, '{}');

        // Send notification.  
        const dataPush = {
            action: PushType.WHITDRAW_FUNDS
        };
        this.notificationService.sendNotifications(
            user,
            getText(TextType.WHITDRAW_FUNDS_TITLE),
            `${getText(TextType.WHITDRAW_FUNDS_DESCRIPTION)} ${data.amount}USD`,
            dataPush
        );
        return user;
    }

    verifyPin = async (user: any, pinCode: any) => {

        if (user.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));

        if (user.pinCode === pinCode)
            return true;
        else {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 3)
                user.isBlocked = true;
            this.repository.update(user);
            return false;
        }
    }

    // USERS APP-CMS
    getAllUsersForCMS = async () => {
        let users = await this.repository.getUsersForCMS();
        if (users === null){
            throw new Error('USUARIOS NO ENCONTRADOS');
        }
        // A new users array is created, with only the properties that will be shown in the CMS
        users = users.map((user: any) => {
            return {
                _id: user._id,
                email: user.email,
                createdAt: user.createdAt,
                //the session date will be obtained from the array devices, on its property sessionDate, i need to show the latest
                sessionDate: user.devices.length > 0 ? user.devices.sort((a: any, b: any) => b.sessionDate - a.sessionDate)[0].sessionDate : '',
                //the businessName is only for the persona moral users, so if user.roles is not persona moral, it will be empty
                businessName: user.roles.includes(Role.PERSONA_MORAL) ? user.businessName : '',
                //the firstName is only for the persona fisica users, so if user.roles is not persona fisica, it will be empty
                firstName: user.roles.includes(Role.PERSONA_FISICA) ? user.firstName : '',
                //the lastName is only for the persona fisica users, so if user.roles is not persona fisica, it will be empty
                lastName: user.roles.includes(Role.PERSONA_FISICA) ? user.lastName : '',
                //the mothersLastName is only for the persona fisica users, so if user.roles is not persona fisica, it will be empty
                mothersLastName: user.roles.includes(Role.PERSONA_FISICA) ? user.mothersLastName : '',
                roles: user.roles,
                isActive: user.isActive,
                isDeleted: user.isDeleted,
                isBlocked: user.isBlocked
            }
        })
        return users;
    }

    changeStatusUserForCMS = async (id: string, field: string) => {
        // Depending on the field, the status of the user will be changed
        if (id.length !== 24){
            throw new Error('ID INVALIDO');
        }
        let user = await this.repository.getById(id);
        if (user === null){
            throw new Error('USUARIO NO ENCONTRADO');
        }
        if (field === 'isActive'){
            user.isActive = !user.isActive;
            return await this.repository.update(user);
        }
        else if (field === 'isBlocked'){
            user.isBlocked = !user.isBlocked;
            return await this.repository.update(user);
        }
        else if (field === 'isDeleted'){
            user.isDeleted = !user.isDeleted;
            return await this.repository.update(user);
        }
    }

    startPreregister = async (userdata:RecoverPasswordDto): Promise<any> => {
        try{
            // Check if the user already has been preregistered based on the user data
            const register = await this.preregisgterService.getByPhoneAndEmail(userdata);
            if (register !== null){
                return register;
            }
        }catch (error){
            console.error('Error getting user info:', error.message);
            throw new Error(error.message);
        }        

        // If the user does not have a preregister, a new preregister is generated
    
        try {
            const intialObject = new Preregisters({
                phoneCode: userdata.phoneCode,
                phone: userdata.phone,
                email: userdata.email
            });
            const register = await this.preregisgterService.create(intialObject);
            console.log("registroTruora",register);
                  
            return register; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error creating register', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };

    generateTruoraProcessUrl = async (phone: string,crear?: boolean,nacionalidad?:string,othernation?:string,residenciatemp?:boolean,recidenciaperm?:boolean,motivo?:string): Promise<any> => {
        try{
            // Check if the user already has a process_id based on the phone number
            const register = await this.registerService.getByAccountIdAndStatus(phone, "created");
            // If the user already has a process_id, the process_id is returned
            if (register !== null && crear == false){
                return register;
            }
        }catch (error){
            console.error('Error getting Truora process_id:', error.message);
            throw new Error(error.message);
        }       
        
        var data = new URLSearchParams({
            key_name: 'FLUJOPF',
            key_type: 'web',
            grant: 'digital-identity',
            api_key_version: '1',
            country: 'ALL',
            redirect_url: 'https://orange-mud-01409780f.4.azurestaticapps.net/',
            flow_id: 'IPF069df03f568653f11b93daea4b69f44d',
            account_id: phone
        });

        if(nacionalidad.toLowerCase() == "extranjera"){
            data = new URLSearchParams({
                key_name: 'FlujoPFExtranjera',
                key_type: 'web',
                grant: 'digital-identity',
                api_key_version: '1',
                country: 'ALL',
                redirect_url: 'https://orange-mud-01409780f.4.azurestaticapps.net/',
                flow_id: 'IPF74c1bcd19b1bc15921f12609973748a0',
                account_id: phone
            });
        }
        // If the user does not have a process_id, a new process_id is generated
        
    
        try {
            const response = await axios.post('https://api.account.truora.com/v1/api-keys', data.toString(), {
                headers: {
                    'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            if (response.status === 200){
                const decodedJwt = jwt.decode(response.data.api_key);
                var process_id = "";
                // Decode the JWT
                if (typeof decodedJwt === 'object' && decodedJwt !== null) {
                    // Parse the additional_data field to a JSON object
                    const additionalData = JSON.parse(decodedJwt.additional_data);
                    // Access the flow_id
                    process_id = additionalData.process_id;
                }
                //if the response is successful, the data is saved in the database
                const intialObject = new Registers({
                    account_id: data.get('account_id'),
                    process_id: process_id,
                    flow_id: data.get('flow_id'),
                    initialurl: `https://identity.truora.com/?token=${response.data.api_key}`,
                    status: "created",
                    data_obtenida:{"nacionalidad":nacionalidad,"othernation":othernation,"residenciatemp":residenciatemp,"recidenciaperm":recidenciaperm,"motivo":motivo}
                });
                const register = await this.registerService.create(intialObject);
                console.log("registroTruora",register);
            }            
            return response.data; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error making POST request:', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };

    generateSapSignProcessUrl = async (id: string): Promise<any> => {
        // try{
        //     // Check if the user already has a process_id based on the phone number
        //     const register = await this.registerService.getByAccountIdAndStatus(phone, "created");
        //     // If the user already has a process_id, the process_id is returned
        //     if (register !== null && crear == false){
        //         return register;
        //     }
        // }catch (error){
        //     console.error('Error getting Truora process_id:', error.message);
        //     throw new Error(error.message);
        // }        

        const register = await this.registerService.getStatusByAccountId(id);

        // If the user does not have a process_id, a new process_id is generated
        const data = new URLSearchParams({
            key_name: 'ZapSign',
            key_type: 'web',
            grant: 'digital-identity',
            api_key_version: '1',
            country: 'ALL',
            redirect_url: 'https://orange-mud-01409780f.4.azurestaticapps.net/',
            flow_id: 'IPF30fb7783937dd805d6127af8517b74c9',
            account_id: id
        });
    
        try {
            const response = await axios.post('https://api.account.truora.com/v1/api-keys', data.toString(), {
                headers: {
                    'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            if (response.status === 200){
                const decodedJwt = jwt.decode(response.data.api_key);
                var process_id = "";
                // Decode the JWT
                if (typeof decodedJwt === 'object' && decodedJwt !== null) {
                    // Parse the additional_data field to a JSON object
                    const additionalData = JSON.parse(decodedJwt.additional_data);
                    // Access the flow_id
                    process_id = additionalData.process_id;
                }

                register.process_id = process_id;
                register.flow_id = data.get('flow_id');
                register.initialurl = `https://identity.truora.com/?token=${response.data.api_key}`
                register.status = "PASO19";
                //if the response is successful, the data is saved in the database
                // const intialObject = new Registers({
                //     account_id: data.get('account_id'),
                //     process_id: process_id,
                //     flow_id: data.get('flow_id'),
                //     initialurl: `https://identity.truora.com/?token=${response.data.api_key}`,
                //     status: "created"
                // });
                // const register = await this.registerService.create(intialObject)
                await this.registerService.update(register);
                console.log("registroTruora",register);

            }            
            return response.data; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error making POST request:', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };

    //create a service that registers the results of the flow in the mongoDB
    registerFlowTruora = async (data: any): Promise<any> => {
        console.log("JWT DECODED: ",data);
        console.log("JWT object: ",data.events[0].object);
        if(data.events[0].event_action == "success"){
            try {
                const response = await axios.get(`https://api.identity.truora.com/v1/processes/${data.events[0].object.identity_process_id}/result?account_id=${data.events[0].object.account_id}`, {
                    headers: {
                        'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                        'Accept': 'application/json'
                    }
                });
    
                
                const register = await this.registerService.updateRegister(response.data);
    
                return register; // Return the response data to be used in the controller
            } catch (error) {
                console.error('Error making POST request:', error.message);
                throw new Error(error.response.data.message); // Rethrow with error message
            }
        } else if(data.events[0].event_action == "failed") {
            
            try {
                console.log('Event failed. Taking necessary action.');
                const response = await axios.get(`https://api.identity.truora.com/v1/processes/${data.events[0].object.process_id}/result?account_id=${data.events[0].object.account_id}`, {
                    headers: {
                        'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                        'Accept': 'application/json'
                    }
                });

                console.log("Response: ",response.data);
                const register = await this.registerService.updateRegister(response.data);
    
                return register;
                
            } catch (error) {
                console.error('Error handling failed event:', error.message);
                throw new Error('An error occurred while handling a failed event.');
            }
        }
        return "EVENT NOT SUCCEED OR FAILED"; // For cases where event_action is neither "succeeded" nor "failed".
    };


    // getDictionary
    getDictRegister = async (): Promise<any> => {
        try{
            const register = await this.dictService.getAll();
            return register;
          
        }catch (error){
            console.error('Error getting Truora status', error.message);
            throw new Error(error.message);
        }   
    }
    // Create a service that receives the userId and returns the status of the process
    getTruoraStatus = async (userId: string): Promise<any> => {
        try{
            const register = await this.registerService.getStatusByAccountId(userId);
            
            if (register === null){
                throw new Error('PROCESS NOT FOUND');
            }
            
            const process_id = register.process_id;

            if(register.status == 'created' || register.status == 'Truora pending'){
                try {
                    const response = await axios.get(`https://api.identity.truora.com/v1/processes/${process_id}/result?account_id=${userId}`, {
                        headers: {
                            'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                            'Accept': 'application/json'
                        }
                    });
        
                    
                    const register2 = await this.registerService.updateRegister(response.data);
        
                    return register2; // Return the response data to be used in the controller
                } catch (error) {
                    return register;
                }
            }else{

                if(register.status == 'PASO19' || register.status == 'PASO20 - pending'){
                    try {
                        const response = await axios.get(`https://api.identity.truora.com/v1/processes/${process_id}/result?account_id=${userId}`, {
                            headers: {
                                'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                                'Accept': 'application/json'
                            }
                        });
            
                        
                        const register2 = await this.registerService.updateRegister2(response.data);
            
                        return register2; // Return the response data to be used in the controller
                    } catch (error) {
                        return register;
                    }
                }else{
                return register;
                }
            }
        }catch (error){
            console.error('Error getting Truora status', error.message);
            throw new Error(error.message);
        }   
    }

    updateTruoraRegister = async (userId: string, data: any,status:string): Promise<any> => {
        try{
            console.log('userId', userId);
            console.log('data', data);
            const register = await this.registerService.updateStatusByAccountId(userId, data,status);
            if(status.toUpperCase() == "PASO15B" || status.toUpperCase() == "PASO16B"){
                await this.notificationService.sendEmail2(data.email_proveedor, "trasmisora://register?userid="+userId+"?tipoproveedor="+data.tipo_proveedor);
                await this.notificationService.sendSMS2(data.celular_proveedor, "trasmisora://register?userid="+userId+"?tipoproveedor="+data.tipo_proveedor);
            }
            if (register === null){
                throw new Error('PROCESS NOT FOUND');
            }
            return register;
        }catch (error){
            console.error('Error updating Register Object', error.message);
            throw new Error(error.message);
        }   
    }
    

    // CMS

    createUserCMS = async (user:any) => {        

        let userDb = await this.repository.getByEmail(user.email);
        if (userDb !== null)
            throw new Error(MSG_EMAIL_ALREADY_REGISTERED);

        const hashedPassword = await bcrypt.hash('Aa.123456', 10);
        userDb = await this.repository.create({
            ...user,
            isActive: true,
            password: hashedPassword,
            roles: [user.role]
        });

        // const userDb = this.create(user);
        return userDb;
    }
    
    updateUserCMS = async (user:any) => {        

        let userDb = await this.repository.getById(user._id);
        if (userDb === null)
            throw new Error('USUARIO NO ENCONTRADO');

        userDb.firstName = user.firstName;
        userDb.lastName = user.lastName;
        userDb.mothersLastName = user.mothersLastName;
        userDb.phone = user.phone;
        userDb.email = user.email;
        userDb.roles = [user.role];
        
        userDb = this.repository.update(userDb);

        return userDb;
    }

    deleteUserCMS = async (user:any) => {        

        let userDb = await this.repository.getById(user._id);
        if (userDb === null)
            throw new Error('USUARIO NO ENCONTRADO');
        
        userDb = this.repository.delete(userDb);

        return userDb;
    }
    
    loginAdmin = async (loginDto: LoginDto) => {

        let userDb = await this.repository.getByEmail(loginDto.email);
        if (!userDb)
            throw new Error(getText(TextType.WRONG_ACCESS_DATA));

        const isPasswordMatching = await bcrypt.compare(loginDto.password, userDb.password);
        if (!isPasswordMatching)
            throw new Error(getText(TextType.WRONG_ACCESS_DATA));


        if (userDb.roles[0] !== Role.ADMIN)
            throw new Error(MSG_NOT_PERMITTED);

        userDb.password = undefined;
        const tokenData = this.createToken(userDb);
        const token = tokenData.token;

        return {
            ...userDb.toJSON(),
            token
        }
    }

    getAllAdmins = async () => {
        let users = await this.repository.getAllAdmins();
        return users
    }

    activate = async (id:string) => {
        let user = await this.repository.getById(id);
        user.isActive = true;
        return await this.repository.update(user);
    }
    
    deactivate = async (id:string) => {
        let user = await this.repository.getById(id);
        user.isActive = false;
        return await this.repository.update(user);
    }

    getAll = async () => {
        let users = await this.repository.getAll();
        return users;
    }

    getAllValidateDocuments = async () => {
        let users = await this.repository.getAllValidateDocuments();
        return users;
    }

    // UPDATE
    updatePersonalData = async (user: any, data: any) => {

        // TODO: Validar tipo de usuario.

        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.mothersLastName = data.mothersLastName;
        user.emailSecondary = data.emailSecondary;
        user.gender = data.gender;
        user.birthdate = data.birthdate;
        user.countryOfBirth = data.countryOfBirth;
        user.federalEntityOfBirth = data.federalEntityOfBirth;
        user.occupation = data.occupation;
        user.curp = data.curp;

        for (let i = 0; i < data.address.length; i++) {
            const address = data.address[i];
            let addressDb = user.address.find((x: any) => x._id.toString() === address._id.toString());
            addressDb.country = address.country;
            addressDb.state = address.state;
            addressDb.municipality = address.municipality;
            addressDb.city = address.city;
            addressDb.suburb = address.suburb;
            addressDb.street = address.street;
            addressDb.exteriorNumber = address.exteriorNumber;
            addressDb.interiorNumber = address.interiorNumber;
            addressDb.cp = address.cp;
            await this.addressRepository.update(addressDb);
        }

        user = await this.repository.update(user);

        return user;
    }

    updateDocuments = async (user: any, data: any) => {

        // TODO: Validar tipo de usuario.

        const {
            ineFront,
            ineBack,
            passportFront,
            passportBack } = data;

        user.ineFront = ineFront;
        user.ineBack = ineBack;
        user.passportFront = passportFront;
        user.passportBack = passportBack;

        // KYC.
        let img1 = '';
        let img2 = '';
        if (ineFront !== undefined && ineBack !== undefined) {
            img1 = await imageToBase64(ineFront._id);
            img2 = await imageToBase64(ineBack._id);
        }

        // Passport
        if (passportFront !== undefined) {
            img1 = await imageToBase64(passportFront._id);
        }

        if (passportBack !== undefined) {
            img2 = await imageToBase64(passportBack._id);
        }

        if (ineFront !== undefined) {
            if (img1 === '' || img2 === '')
                throw new Error('Todos los campos son requeridos.');
        }
        else {
            if (img1 === '')
                throw new Error('Todos los campos son requeridos.');
        }

        // TODO: Delete old files.

        const res = await this.kycService.requestIdentityDocumentVerification(user._id, img1, img2);
        user = await this.repository.update(user);

        return { "uuid": res };
    }

    updateTaxInformation = async (user: any, data: any) => {

        // TODO: Validar tipo de usuario.

        user.businessName = data.businessName;
        user.businessLine = data.businessLine;
        user.rfc = data.rfc;
        user.businessId = data.businessId;
        user.countryOfAssignment = data.countryOfAssignment;
        user.electronicSignatureSeries = data.electronicSignatureSeries;
        // TODO: Adress

        const businessAddress = data.businessAddress[0];
        let address: any = await this.addressRepository.getById(businessAddress._id);
        address.country = businessAddress.country;
        address.state = businessAddress.state;
        address.municipality = businessAddress.municipality;
        address.city = businessAddress.city;
        address.suburb = businessAddress.suburb;
        address.street = businessAddress.street;
        address.exteriorNumber = businessAddress.exteriorNumber;
        address.interiorNumber = businessAddress.interiorNumber;
        address.cp = businessAddress.cp;
        address.phoneNumber = businessAddress.phoneNumber;
        address.email = businessAddress.email;
        address.constitutionDate = businessAddress.constitutionDate;

        await this.addressRepository.update(address);

        user = await this.repository.update(user);

        return user;
    }

    updateFiles = async (user: any, data: any) => {

        // TODO: Validar tipo de usuario.

        const { files, administratorsInes } = data;

        // TODO: Validar existencia de catálogos.

        if (files === undefined)
            throw new Error('Los archivos son requeridos.');

        if (administratorsInes === undefined)
            throw new Error('Los ines de los administradores son requeridos.');

        for (let k = 0; k < administratorsInes.length; k++) {
            let item = administratorsInes[k];
            let administrator: any = await this.administratorRepository.getById(item._id);
            // TODO: Validate if exist.

            // Send to Veridoc.
            let frontImage = await imageToBase64(item.ineFront._id);
            let backImage = await imageToBase64(item.ineBack._id);

            const res = await this.kycService.requestIdentityDocumentVerification(item._id, frontImage, backImage);

            administrator.ineFront = item.ineFront._id;
            administrator.ineBack = item.ineBack._id;
            administrator.ineStatus = 'WaitingCheckin';
            administrator.veridocId = res;

            await this.administratorRepository.update(administrator);
        }

        user.files = files;

        // TODO: Delete old files.

        user = await this.repository.update(user);
        return { status: 'ok' }
    }

    updateAvatar = async (user: any, data: any) => {
        user.avatar = data.avatar;
        user.color = data.color;
        user = await this.repository.update(user);
        return user;
    }

    updatePINRequest = async (user: any, pin: any) => {
        await this.verifyService.request({
            value: user.email !== undefined ? user.email : `${user.phoneCode}${user.phone}`
        }, OtpType.UPDATE_PIN, user);
        return true;
    }

    updatePIN = async (user: any, verifyDto: any, pin: any) => {
        console.log(verifyDto);
        let codeDb = await this.otpService.verifyOTP(verifyDto);
        if (codeDb === null)
            
            throw new Error(getText(TextType.BAD_CODE));

        if (codeDb.isUsed)
            throw new Error(getText(TextType.USED_CODE));

        if (codeDb.otpType === OtpType.UPDATE_PIN) {
            // TODO: Validar fecha vencimiento.
            if (codeDb.user.toString() === user._id.toString()) {
                user.pinCode = pin;

                codeDb.isUsed = true
                const otpRepository = new OtpRepository(OTP);
                otpRepository.update(codeDb);

                await this.update(user);
                await this.notificationService.sendInfoEmail(user.email,getText(TextType.PIN_UPDATE_HEADER),getText(TextType.PIN_UPDATE_MESSAGE));

                // await this.verifyService.request()
                // await this.verifyService.request({
                //     value: user.email !== undefined ? user.email : `${user.phoneCode}${user.phone}`
                // }, OtpType.UPDATE_PIN, user);
                return true;
            }
        }

        return false;
    }

    // let codeDb = await this.otpService.verify(verifyDto);
    // if (codeDb === null)
    //     throw new Error('Código incorrecto');

    requestCard = async (user: any) => {

        // if (user.cards.length > 0)
        //     throw new Error('Ya haz solicitado una tarjeta.');

        const address = user.address[0];
        let pomeloUserId = user.pomeloUserId;

        if (user.pomeloUserId === undefined) {
            // Register user on POMELO.
            let pomeloUser: any = {
                "name": user.firstName,
                "surname": user.lastName,
                "identification_type": user.identificationType === 'VOTING_CARD' ? 'INE' : 'PASSPORT',
                "identification_value": user.identificationNumber,
                "birthdate": moment(user.birthdate).format('YYYY-MM-DD'),
                "gender": user.gender,
                "email": user.email ? user.email : user.emailSecondary,
                "phone": user.phone ? user.phone : '0',
                "nationality": "MEX",
                "legal_address": {
                    "street_name": address.street,
                    "street_number": address.exteriorNumber,
                    "floor": 1,
                    "apartment": address.interiorNumber,
                    "zip_code": address.cp,
                    "city": address.city,
                    "region": address.state,
                    "country": "MEX"
                },
                "operation_country": "MEX"
            }

            console.log(pomeloUser);

            pomeloUser = await this.pomeloService.createUser(pomeloUser);

            if (pomeloUser.includes('error')) {
                pomeloUser = JSON.parse(pomeloUser);
                console.log(pomeloUser);
                if (pomeloUser.error.details !== undefined)
                    throw new Error(pomeloUser.error.details[0].detail);
                else
                    throw new Error(pomeloUser.error.message);
            }

            pomeloUser = JSON.parse(pomeloUser);

            pomeloUserId = pomeloUser.data.id;
            user.pomeloUserId = pomeloUser.data.id;
            user.pomeloClientId = pomeloUser.data.client_id;
            await this.repository.update(user);
        }

        let card: any = {
            "user_id": pomeloUserId,
            "affinity_group_id": this.affinity_group_id,
            "card_type": "VIRTUAL",
            "address": {
                "street_name": address.street,
                "street_number": address.exteriorNumber,
                "floor": 1,
                "apartment": address.interiorNumber,
                "city": address.city,
                "region": address.state,
                "country": "MEX",
                "zip_code": address.cp
            }
        }

        console.log(card);
        card = await this.pomeloService.createCard(card);
        console.log(card);

        // Persist card.
        card = JSON.parse(card);
        const cardData = {
            cardId: card.data.id,
            affinityGroupId: card.data.affinity_group_id,
            cardType: card.data.card_type,
            status: card.data.status,
            userId: card.data.user_id,
            startDate: card.data.start_date,
            affinityGroupName: card.data.affinity_group_name,
            lastFour: card.data.last_four,
            provider: card.data.provider,
            productType: card.data.product_type
        }
        card = await this.cardService.create(cardData);

        user.cards.push(card);
        await this.repository.update(user);

        return card;
    }

    cancelCard = async (user: any, idCard: any) => {

        if (user.cards.length === 0)
            throw new Error('No cuentas con tarjetas registradas');

        let cardDb = user.cards[0];
        let data: any = {
            "affinity_group_id": this.affinity_group_id,
            "status": "BLOCKED",
            "status_reason": "CLIENT_INTERNAL_REASON"
        }

        data = await this.pomeloService.updateCard(cardDb.cardId, data);
        cardDb.status = 'BLOCKED';
        cardDb = await this.cardService.update(cardDb);
        return cardDb;
    }

    private createToken(user: any): TokenData {
        const dataStoredInToken: DataStoredInToken = {
            id: user._id,
            role: user.role
        };
        return {
            expiresIn: TOKEN_EXPIRES,
            token: jwt.sign(dataStoredInToken, SECRET, { expiresIn: TOKEN_EXPIRES }),
        };
    }

    private createTokenForCMSUser(userName: string): TokenData{
        const dataStoredInToken: DataStoredInTokenCMS = {
            userName: userName,
            role: Role.ADMIN
        };
        return {
            expiresIn: TOKEN_EXPIRES,
            token: jwt.sign(dataStoredInToken, SECRET, { expiresIn: TOKEN_EXPIRES }),
        };
    }
}

export default UserService;
