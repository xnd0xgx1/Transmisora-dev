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
import IRegisters from "../interfaces/IRegisters";
import RegisterDto from "../dto/RegisterDto";
import UserDto from "../dto/UserDto";


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

        console.log("USER DATA: ",userDb);
        console.log("USER BLOCKED");
        if (userDb.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));
        console.log("Userpass: ",loginDto.password);
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

    setPasswordOTP = async (newpassword: any,user:any) => {

        let newuser = await this.repository.getById(user);
        if (newuser.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));

        
        const isPasswordMatching = await bcrypt.compare(newpassword, newuser.password );
        if (isPasswordMatching)
            throw new Error(getText(TextType.SAME_PASS));
        
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedPassword;
        await this.update(user);
        return true;
    }



    setPassword = async (setPasswordDto: any) => {


        let value = setPasswordDto.value ? setPasswordDto.value :  setPasswordDto.phoneCode + setPasswordDto.phone;
        let verify = await this.verifyService.getByValue(value);
        console.log("verify item",verify);
        if (verify === null)
            throw new Error("El código ingresado es incorrecto 1");

        if (verify.otp.otpType !== OtpType.RECOVER_PASSWORD)
            throw new Error("El código ingresado es incorrecto 2");

        if (setPasswordDto.code !== verify.otp.code)
            throw new Error("El código ingresado es incorrecto 3");

        // TODO: Verificar el tiempo de validez del código.

        // TODO: Verificar intentos de uso.
        let user = null;
        if (setPasswordDto.value != null) {
            user = await this.repository.getByEmail(value)
        }
        else {
            user = await this.repository.getByPhone(setPasswordDto.phoneCode, setPasswordDto.phone)
        }

    

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

    randomUsername = async (userid: any) => {
        let usuarios: any;
        let random: string;
        let dbuser = await this.registerService.getByAccountIdAndStatus(userid,"");
        console.log("DBUSER: ",dbuser);
        do {
            let num = Math.floor(100000 + Math.random() * 900000)
            if(dbuser.Truora.first_name != undefined){
                random = `${(dbuser.Truora.first_name).replace(/\s/g,'')}${num}`
            }else{
                random = `${(dbuser.data_obtenida.razonsocial ? dbuser.data_obtenida.razonsocial : "").replace(/\s/g,'')}${num}`
            }
            usuarios = await this.repository.getByUserName(random);
        }
        while (usuarios != null);
        return random;
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
    verifypass = async (user: any, pass: any) => {

        if (user.isBlocked)
            throw new Error(getText(TextType.BLOCKED_ACCOUNT));
        
        console.log("PASS: ",pass.trim());
        const isPasswordMatching = await bcrypt.compare(pass.trim(),user.password);
        if (isPasswordMatching){
            user.failedLoginAttempts = 0;
            this.repository.update(user);
            return true;
        }
        else {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 3)
                user.isBlocked = true;
            this.repository.update(user);
            return false;
        }
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

    getAllUsersfilesForCMS = async () => {
        let users = await this.registerService.getUsersFilesForCMS();
        if (users === null){
            throw new Error('USUARIOS NO ENCONTRADOS');
        }
        // A new users array is created, with only the properties that will be shown in the CMS
        let newuserobj = [];
        for (const element of users) {
            try{
            // const preregistro = await this.preregisgterService.getById(element.account_id);
            // console.log("Preregister!!", preregistro);
            let date = "";
            if(element.files.length == 0){
                date = element.createdAt;
            }else{
                date = element.files[0].updatedAt ?? element.updatedAt;
            }
            const usr = {
                account_id: element.account_id,
                files: element.files,
                date: date,
                status: element.status,
                nombre: element.data_obtenida.razonsocial ? element.data_obtenida.razonsocial : element.Truora.first_name + " " + element.Truora.last_name,
                email: (element.accountDetails.email ? element.accountDetails.email : "No hay preregistro"),
                telefono: (element.accountDetails.phoneCode ? element.accountDetails.phone : "No hay preregistro")
            };
            newuserobj.push(usr);
            }
            catch(e){
                continue;
            }
        }
        console.log("Return object");
        return newuserobj;
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
                firstName: user.roles.includes(Role.PERSONA_FISICA) ? user.firstName : user.datosempresa.razonsocial,
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
                email: userdata.email,
                tipo: 0
            });
            const register = await this.preregisgterService.create(intialObject);
            console.log("registroTruora",register);
                  
            return register; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error creating register', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };

    generateTruoraProcessUrl = async (phone: string,crear?: boolean,nacionalidad?:string,othernation?:string,residenciatemp?:boolean,recidenciaperm?:boolean,motivo?:string,residence?:string, url?:string,id_prev?:string): Promise<any> => {
        try{
            // Check if the user already has a process_id based on the phone number
            const register = await this.registerService.getByAccountIdAndStatus(phone, "created");
            // If the user already has a process_id, the process_id is returned
            if (register !== null && crear == false){
                return register;
            }

            const preregister = await this.preregisgterService.getById(phone);

            const hasauser = await this.repository.getByemailandphone(preregister);
            console.log("Has preregister?? ",hasauser);
            if(hasauser != null && crear == true){
                throw new Error("El usuario ya existe!");
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
            redirect_url:  url ? url : 'https://www.cms.trasmisora.com/',
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
                redirect_url:  url ? url : 'https://www.cms.trasmisora.com/',
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
                    prev_register: id_prev ? [id_prev] : [],
                    initialurl: `https://identity.truora.com/?token=${response.data.api_key}`,
                    status: "created",
                    data_obtenida:{"nacionalidad":nacionalidad,"othernation":othernation,"residenciatemp":residenciatemp,"recidenciaperm":recidenciaperm,"motivo":motivo,"residence":residence,"tipopersona":"PERSONA_FISICA"}
                });
                const register = await this.registerService.create(intialObject);
                console.log("registroTruora",register);
                return response.data
            }    
            
            // var process_id = "";
            // //if the response is successful, the data is saved in the database
            // const intialObject = new Registers({
            //     account_id: data.get('account_id'),
            //     process_id: process_id,
            //     flow_id: data.get('flow_id'),
            //     initialurl: '',
            //     status: "created",
            //     data_obtenida:{"nacionalidad":nacionalidad,"othernation":othernation,"residenciatemp":residenciatemp,"recidenciaperm":recidenciaperm,"motivo":motivo,"residence":residence,"tipopersona":"PERSONA_FISICA"}
            // });
            // const register = await this.registerService.create(intialObject);
            // console.log("registroTruora",register);

            // return  {
            //     api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjIiwiYWRkaXRpb25hbF9kYXRhIjoie1wiYWNjb3VudF9pZFwiOlwiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjXCIsXCJjb3VudHJ5XCI6XCJBTExcIixcImZsb3dfaWRcIjpcIklQRjA2OWRmMDNmNTY4NjUzZjExYjkzZGFlYTRiNjlmNDRkXCIsXCJyZWRpcmVjdF91cmxcIjpcImh0dHBzOi8vb3JhbmdlLW11ZC0wMTQwOTc4MGYuNC5henVyZXN0YXRpY2FwcHMubmV0L1wiLFwicHJvY2Vzc19pZFwiOlwiSURQMTBiMTMwNjc3YTA0M2MyZDMxMTE3MDc2NzcxYjViYTVcIn0iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MTcxNjg0NjM4OSwiZ3JhbnQiOiJkaWdpdGFsLWlkZW50aXR5IiwiaWF0IjoxNzE2ODM5MTg5LCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9LM2VERGhMZjYiLCJqdGkiOiI1MWU0MWVlMC1jNzJmLTQ1MGQtOWYwMC01Mzc5NTliNTVmNmQiLCJrZXlfbmFtZSI6InRlc3QtMSIsImtleV90eXBlIjoid2ViIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.v7E6xFEeh8O6aPig0O4VTA9HDJjmmc6GYwLzrRqR9iU',
            //     message: 'API key created successfully'
            //   }; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error making POST request:', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };



    generateonlygeolocation = async (phone: string,crear?: boolean,url?:string,id_prev?:string): Promise<any> => {
        try{
            // Check if the user already has a process_id based on the phone number
            const register = await this.registerService.getByAccountIdAndStatus(phone, "created");
            // If the user already has a process_id, the process_id is returned
            if (register !== null && crear == false){
                return register;
            }

            const preregister = await this.preregisgterService.getById(phone);
            const hasauser = await this.repository.getByemailandphone(preregister);
            console.log("Has preregister?? ",hasauser);
            if(hasauser != null && crear == true){
                throw new Error("El usuario ya existe!");
            }

        }catch (error){
            console.error('Error getting Truora process_id:', error.message);
            throw new Error(error.message);
        }       
        
        var data = new URLSearchParams({
            key_name: 'PFCMS',
            key_type: 'web',
            grant: 'digital-identity',
            api_key_version: '1',
            country: 'ALL',
            redirect_url: url ? url : 'https://www.cms.trasmisora.com/',
            flow_id: 'IPF82d69731a9307f4b0131820c84138284',
            account_id: phone
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
                //if the response is successful, the data is saved in the database
                const intialObject = new Registers({
                    account_id: data.get('account_id'),
                    process_id: process_id,
                    flow_id: data.get('flow_id'),
                    prev_register: id_prev ? [id_prev] : [],
                    initialurl: `https://identity.truora.com/?token=${response.data.api_key}`,
                    status: "created",
                    data_obtenida:{"tipopersona":"PERSONA_MORAL"}
                });
                const register = await this.registerService.create(intialObject);
                console.log("registroTruora",register);
                return response.data
            }    
            
            // var process_id = "";
            // //if the response is successful, the data is saved in the database
            // const intialObject = new Registers({
            //     account_id: data.get('account_id'),
            //     process_id: process_id,
            //     flow_id: data.get('flow_id'),
            //     initialurl: '',
            //     status: "created",
            //     data_obtenida:{"tipopersona":"PERSONA_MORAL"}
            // });
            // const register = await this.registerService.create(intialObject);
            // console.log("registroTruora",register);

            // return  {
            //     api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjIiwiYWRkaXRpb25hbF9kYXRhIjoie1wiYWNjb3VudF9pZFwiOlwiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjXCIsXCJjb3VudHJ5XCI6XCJBTExcIixcImZsb3dfaWRcIjpcIklQRjA2OWRmMDNmNTY4NjUzZjExYjkzZGFlYTRiNjlmNDRkXCIsXCJyZWRpcmVjdF91cmxcIjpcImh0dHBzOi8vb3JhbmdlLW11ZC0wMTQwOTc4MGYuNC5henVyZXN0YXRpY2FwcHMubmV0L1wiLFwicHJvY2Vzc19pZFwiOlwiSURQMTBiMTMwNjc3YTA0M2MyZDMxMTE3MDc2NzcxYjViYTVcIn0iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MTcxNjg0NjM4OSwiZ3JhbnQiOiJkaWdpdGFsLWlkZW50aXR5IiwiaWF0IjoxNzE2ODM5MTg5LCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9LM2VERGhMZjYiLCJqdGkiOiI1MWU0MWVlMC1jNzJmLTQ1MGQtOWYwMC01Mzc5NTliNTVmNmQiLCJrZXlfbmFtZSI6InRlc3QtMSIsImtleV90eXBlIjoid2ViIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.v7E6xFEeh8O6aPig0O4VTA9HDJjmmc6GYwLzrRqR9iU',
            //     message: 'API key created successfully'
            //   }; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error making POST request:', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };

    generateSapSignProcessUrl = async (id: string,url?:string): Promise<any> => {
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
            redirect_url: url ? url : 'https://www.cms.trasmisora.com/',
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
                return response.data

            }    
            
            // register.process_id = "";
            // register.flow_id = data.get('flow_id');
            // register.initialurl = "";
            // register.status = "PASO19";
            // //if the response is successful, the data is saved in the database
            // // const intialObject = new Registers({
            // //     account_id: data.get('account_id'),
            // //     process_id: process_id,
            // //     flow_id: data.get('flow_id'),
            // //     initialurl: `https://identity.truora.com/?token=${response.data.api_key}`,
            // //     status: "created"
            // // });
            // // const register = await this.registerService.create(intialObject)
            // await this.registerService.update(register);

            // return  {
            //     api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjIiwiYWRkaXRpb25hbF9kYXRhIjoie1wiYWNjb3VudF9pZFwiOlwiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjXCIsXCJjb3VudHJ5XCI6XCJBTExcIixcImZsb3dfaWRcIjpcIklQRjA2OWRmMDNmNTY4NjUzZjExYjkzZGFlYTRiNjlmNDRkXCIsXCJyZWRpcmVjdF91cmxcIjpcImh0dHBzOi8vb3JhbmdlLW11ZC0wMTQwOTc4MGYuNC5henVyZXN0YXRpY2FwcHMubmV0L1wiLFwicHJvY2Vzc19pZFwiOlwiSURQMTBiMTMwNjc3YTA0M2MyZDMxMTE3MDc2NzcxYjViYTVcIn0iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MTcxNjg0NjM4OSwiZ3JhbnQiOiJkaWdpdGFsLWlkZW50aXR5IiwiaWF0IjoxNzE2ODM5MTg5LCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9LM2VERGhMZjYiLCJqdGkiOiI1MWU0MWVlMC1jNzJmLTQ1MGQtOWYwMC01Mzc5NTliNTVmNmQiLCJrZXlfbmFtZSI6InRlc3QtMSIsImtleV90eXBlIjoid2ViIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.v7E6xFEeh8O6aPig0O4VTA9HDJjmmc6GYwLzrRqR9iU',
            //     message: 'API key created successfully'
            //   };
            // console.log("registroTruora",register);
            // return response.data; // Return the response data to be used in the controller
        } catch (error) {
            console.error('Error making POST request:', error.message);
            throw new Error(error.response.data.message); // Rethrow with error message
        }
    };

    generateSapSignProcessUrlPM = async (id: string,url?:string): Promise<any> => {
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
            redirect_url: url ? url : 'https://www.cms.trasmisora.com/',
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
                register.status = "FIRMA_DECLARACION";
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
                return response.data

            }    
            
            // register.process_id = "";
            // register.flow_id = data.get('flow_id');
            // register.initialurl = "";
            // register.status = "FIRMA_DECLARACION";
            // //if the response is successful, the data is saved in the database
            // // const intialObject = new Registers({
            // //     account_id: data.get('account_id'),
            // //     process_id: process_id,
            // //     flow_id: data.get('flow_id'),
            // //     initialurl: `https://identity.truora.com/?token=${response.data.api_key}`,
            // //     status: "created"
            // // });
            // // const register = await this.registerService.create(intialObject)
            // await this.registerService.update(register);

            // return  {
            //     api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjIiwiYWRkaXRpb25hbF9kYXRhIjoie1wiYWNjb3VudF9pZFwiOlwiNjY0Yjc5ZjZlYjZjM2U0ZWNlODVkYzRjXCIsXCJjb3VudHJ5XCI6XCJBTExcIixcImZsb3dfaWRcIjpcIklQRjA2OWRmMDNmNTY4NjUzZjExYjkzZGFlYTRiNjlmNDRkXCIsXCJyZWRpcmVjdF91cmxcIjpcImh0dHBzOi8vb3JhbmdlLW11ZC0wMTQwOTc4MGYuNC5henVyZXN0YXRpY2FwcHMubmV0L1wiLFwicHJvY2Vzc19pZFwiOlwiSURQMTBiMTMwNjc3YTA0M2MyZDMxMTE3MDc2NzcxYjViYTVcIn0iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MTcxNjg0NjM4OSwiZ3JhbnQiOiJkaWdpdGFsLWlkZW50aXR5IiwiaWF0IjoxNzE2ODM5MTg5LCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV9LM2VERGhMZjYiLCJqdGkiOiI1MWU0MWVlMC1jNzJmLTQ1MGQtOWYwMC01Mzc5NTliNTVmNmQiLCJrZXlfbmFtZSI6InRlc3QtMSIsImtleV90eXBlIjoid2ViIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.v7E6xFEeh8O6aPig0O4VTA9HDJjmmc6GYwLzrRqR9iU',
            //     message: 'API key created successfully'
            //   };
            // console.log("registroTruora",register);
            // return response.data; // Return the response data to be used in the controller
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

                const demoresult = {
                    "process_id": "IDPdd377e2659c344ea28347c478b72ee8d",
                    "account_id": userId,
                    "client_id": "TCIa3e34137d4944d68c1f80a1d0444b6a0",
                    "flow_id": "IPF069df03f568653f11b93daea4b69f44d",
                    "document_number": "PILJ941223HMNNNR07",
                    "first_name": "JORGE LUIS",
                    "last_name": "PINTOR LEON",
                    "created_via": "web",
                    "flow_version": { "$numberInt": "24" },
                    "country": "MX",
                    "status": "success",
                    "check_id": "CHK0ed46b40be95c115c2309b54d2883a1c",
                    "validations": [
                      {
                        "validation_id": "VLDd4de01e31057b52a0cab9ca27e2c173a",
                        "ip_address": "177.224.182.194",
                        "account_id": "663bae9b3e15ef2f941cf356",
                        "type": "document-validation",
                        "validation_status": "success",
                        "creation_date": "2024-05-09T18:17:07.286108548Z",
                        "details": {
                          "background_check": {
                            "check_id": "CHK5676af0880b2f9c2f672618c47148657",
                            "check_url": "https://api.checks.truora.com/v1/checks/CHK5676af0880b2f9c2f672618c47148657"
                          },
                          "document_details": {
                            "client_id": "TCIa3e34137d4944d68c1f80a1d0444b6a0",
                            "country": "MX",
                            "doc_id": "DCR4a629035b482eff606a8353931d43429",
                            "document_type": "national-id",
                            "creation_date": "2024-05-09T18:17:07.208451259Z",
                            "date_of_birth": "1994-12-23T00:00:00Z",
                            "document_number": "PILJ941223HMNNNR07",
                            "expiration_date": "2029-01-01T00:00:00Z",
                            "gender": "male",
                            "issue_date": "2019-01-01T00:00:00Z",
                            "last_name": "PINTOR LEON",
                            "first_last_name": "PINTOR",
                            "second_last_name": "LEON",
                            "machine_readable": "IDMEX1903856497<<03240941737719412239H2912316MEX<01<<14378<4PINTOR<LEON<<JORGE<LUIS<<<<<<<",
                            "mexico_document": {
                              "cic": "190385649",
                              "citizen_id": "094173771",
                              "elector_key": "PNLNJR94122316H000",
                              "issue_number": "01",
                              "locality": { "$numberInt": "1" },
                              "municipality": {
                                "$numberInt": "20"
                              },
                              "municipality_name": "CUITZEO",
                              "neighborhood": "COL LOS GRANADOS",
                              "ocr": "0324094173771",
                              "section": { "$numberInt": "324" },
                              "state": { "$numberInt": "16" },
                              "state_name": "MICHOACAN"
                            },
                            "mime_type": "image/jpeg",
                            "name": "JORGE LUIS",
                            "postal_code": "58840",
                            "registration_date": "2013-01-01T00:00:00Z",
                            "residence_address": "C NICOLAS REGULES 31 A COL LOS GRANADOS 58840 CUITZEO, MICH.",
                            "state": "16",
                            "state_name": "MICHOACAN",
                            "street": "C NICOLAS REGULES 31 A",
                            "update_date": "2024-05-09T18:18:05.597368747Z"
                          },
                          "document_validations": {
                            "data_consistency": [
                              {
                                "validation_name": "Validation of expiration date",
                                "result": "valid",
                                "validation_type": "expiration-date-validation",
                                "message": "The document has not expired",
                                "manually_reviewed": false,
                                "created_at": "2024-05-09T18:18:05.932144402Z"
                              },
                              {
                                "validation_name": "Validation of mrz",
                                "result": "valid",
                                "validation_type": "mrz-validation",
                                "message": "The front side labels and data machine readable zone match",
                                "manually_reviewed": false,
                                "created_at": "2024-05-09T18:18:05.932132866Z"
                              }
                            ],
                            "government_database": [
                              {
                                "validation_name": "Validation of Government Database - Renapo",
                                "result": "valid",
                                "validation_type": "government-database-digital-validation-renapo",
                                "message": "Document is current and registered in main identity database",
                                "manually_reviewed": false,
                                "created_at": "2024-05-09T18:18:08.348122326Z"
                              },
                              {
                                "validation_name": "Validation of Government Database - INE",
                                "result": "skipped",
                                "validation_type": "government-database-digital-validation-ine",
                                "message": "Another database confirmed identity",
                                "manually_reviewed": false,
                                "created_at": "2024-05-09T18:18:08.347944996Z"
                              }
                            ],
                            "photocopy_analysis": [
                              {
                                "validation_name": "Validation of Photocopy Analysis",
                                "result": "valid",
                                "validation_type": "photocopy-validation",
                                "message": "The document is not a photocopy",
                                "manually_reviewed": false,
                                "created_at": "2024-05-09T18:18:07.026412157Z"
                              }
                            ],
                            "photo_of_photo": [
                              {
                                "validation_name": "Validation of photo of photo",
                                "result": "valid",
                                "validation_type": "photo-of-photo-validation",
                                "message": "The document is not a photo of photo",
                                "manually_reviewed": false,
                                "created_at": "2024-05-09T18:18:06.523284974Z"
                              }
                            ]
                          }
                        },
                        "identity_process_id": "IDPdd377e2659c344ea28347c478b72ee8d",
                        "attachment_status": "valid",
                        "attachment_validations": [
                          {
                            "validation_name": "Validation of face detection",
                            "validation_type": "face-detection-validation",
                            "attachment_type": "document-front",
                            "result": "valid"
                          },
                          {
                            "validation_name": "Validation of document text legibility",
                            "validation_type": "ocr-validation",
                            "attachment_type": "document-front",
                            "result": "valid"
                          },
                          {
                            "validation_name": "Validation of document text legibility",
                            "validation_type": "ocr-validation",
                            "attachment_type": "document-reverse",
                            "result": "valid"
                          }
                        ],
                        "front_image": "https://truora-files-production.s3.us-east-1.amazonaws.com/documents-recognition/TCIa3e34137d4944d68c1f80a1d0444b6a0/TCIa3e34137d4944d68c1f80a1d0444b6a0-663bae9b3e15ef2f941cf356/MX/national-id/web/VLDd4de01e31057b52a0cab9ca27e2c173a/DCR4a629035b482eff606a8353931d43429_front.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQO4PGUYHDVYHVOU6%2F20240509%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240509T181848Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCID%2B1u4HIW52b87TlowW1QQ57pUByVEO%2F3zEVZ9ehv02hAiEAlKacVALVCgEsUOgurIC302JyQ%2B0Z7mAFMNUkUnxL1cYqmQMIGxADGgwwMzE5NzU3MTIyNzAiDMljK98Grfgp6t3eCir2AoaiZ3oDSZ9aF%2FaNHqtAArkkpvfxjb%2BS2P3u3MoXSZ5GwgkSx%2BtWji%2Fi3xX1TeU3TdF3Vk%2FWB1beUIELaPgwHsKYq8LzfHfvKPOP2EOsBAFonWfZAVoMxrwk45cA41Wh0PpqX850HEGmrsguPHLHLC1vprbIlBAj3mLqfG3FZpqZ4HaATNVE5FoXoYEb5hJNUUQkjcfKn03lYHiKlbWEhB8YF1uCTnn3pRGkcLc6A8bpUrh3XUCsy6HXEvwiKu4UtuuLe9Zh4tVLvAgCkVI9uJR8%2FgTmPeytWiV7rJrz74xpfw%2F%2FkJRI7QX5xMwBWuGPD6yzV9vF8jQWo3xByz8NUPsT%2BEwwzGxjMJo9YI479i64mPdj1j6P3dBdHZmYTLaMVvEXpoKpo%2FR55d4JyeqBhZoUYT%2F2tdDNtPhTcUNZOu1dN%2BVkG86TZjMriRFKsnIVr9eNvYwpIQ5gihhpDbdGISRo7M%2FmUEz5Lluqh%2Bg5nAclK%2Bs6pzccMOyN9LEGOp0Bas%2BJUibHN7JgwEHld83IM7K4uvcAaBCgGrHe7qrtvTN8s0yAcMIQmsljk%2F1xCjpbmiPa5gxcQHAI0bfX9dF%2Bs0tH7uG6pFpiFcYo6nv4u2e1pyZyz%2B96nCiEhpXN5tZVC1ntC3TyPg3%2B0N2vATcPv%2B1R925WR6uaCWutoLKaSjB3EHA00AF5VCZvJRyyqHYq67xM7WZaYQn%2BcMUfoQ%3D%3D&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=c7ccae043931d542fe88850f4da428436a66f046aa2ab2db6a62efa53fada946",
                        "reverse_image": "https://truora-files-production.s3.us-east-1.amazonaws.com/documents-recognition/TCIa3e34137d4944d68c1f80a1d0444b6a0/TCIa3e34137d4944d68c1f80a1d0444b6a0-663bae9b3e15ef2f941cf356/MX/national-id/web/VLDd4de01e31057b52a0cab9ca27e2c173a/DCR4a629035b482eff606a8353931d43429_reverse.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQO4PGUYHDVYHVOU6%2F20240509%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240509T181848Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCID%2B1u4HIW52b87TlowW1QQ57pUByVEO%2F3zEVZ9ehv02hAiEAlKacVALVCgEsUOgurIC302JyQ%2B0Z7mAFMNUkUnxL1cYqmQMIGxADGgwwMzE5NzU3MTIyNzAiDMljK98Grfgp6t3eCir2AoaiZ3oDSZ9aF%2FaNHqtAArkkpvfxjb%2BS2P3u3MoXSZ5GwgkSx%2BtWji%2Fi3xX1TeU3TdF3Vk%2FWB1beUIELaPgwHsKYq8LzfHfvKPOP2EOsBAFonWfZAVoMxrwk45cA41Wh0PpqX850HEGmrsguPHLHLC1vprbIlBAj3mLqfG3FZpqZ4HaATNVE5FoXoYEb5hJNUUQkjcfKn03lYHiKlbWEhB8YF1uCTnn3pRGkcLc6A8bpUrh3XUCsy6HXEvwiKu4UtuuLe9Zh4tVLvAgCkVI9uJR8%2FgTmPeytWiV7rJrz74xpfw%2F%2FkJRI7QX5xMwBWuGPD6yzV9vF8jQWo3xByz8NUPsT%2BEwwzGxjMJo9YI479i64mPdj1j6P3dBdHZmYTLaMVvEXpoKpo%2FR55d4JyeqBhZoUYT%2F2tdDNtPhTcUNZOu1dN%2BVkG86TZjMriRFKsnIVr9eNvYwpIQ5gihhpDbdGISRo7M%2FmUEz5Lluqh%2Bg5nAclK%2Bs6pzccMOyN9LEGOp0Bas%2BJUibHN7JgwEHld83IM7K4uvcAaBCgGrHe7qrtvTN8s0yAcMIQmsljk%2F1xCjpbmiPa5gxcQHAI0bfX9dF%2Bs0tH7uG6pFpiFcYo6nv4u2e1pyZyz%2B96nCiEhpXN5tZVC1ntC3TyPg3%2B0N2vATcPv%2B1R925WR6uaCWutoLKaSjB3EHA00AF5VCZvJRyyqHYq67xM7WZaYQn%2BcMUfoQ%3D%3D&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=0efc93dec60bf28f4158c75b9c6543fe029a4a800ab3873528312a0b1372dff5"
                      },
                      {
                        "validation_id": "VLDe6b3d760a850af8eb3cd6ae53e65b00a",
                        "ip_address": "177.224.182.194",
                        "account_id": "663bae9b3e15ef2f941cf356",
                        "type": "face-recognition",
                        "validation_status": "success",
                        "threshold": { "$numberDouble": "0.65" },
                        "creation_date": "2024-05-09T18:18:02.908994043Z",
                        "details": {
                          "face_recognition_validations": {
                            "enrollment_id": "ENR7276d03602976b5fd3461d7c927088b2",
                            "similarity_status": "success",
                            "age_range": {
                              "high": { "$numberInt": "32" },
                              "low": { "$numberInt": "24" }
                            },
                            "confidence_score": {
                              "$numberInt": "1"
                            }
                          }
                        },
                        "identity_process_id": "IDPdd377e2659c344ea28347c478b72ee8d",
                        "front_image": "https://truora-files-production.s3.us-east-1.amazonaws.com/face-recognition-validator/enroll/TCIa3e34137d4944d68c1f80a1d0444b6a0/TCIa3e34137d4944d68c1f80a1d0444b6a0-663bae9b3e15ef2f941cf356/ENR7276d03602976b5fd3461d7c927088b2?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQO4PGUYHP6KBCZF4%2F20240509%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240509T181848Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCCDjlKIY%2F33yGLcFGfpzR%2FFjeGb67hD9kbK8DrXnERUAIhAIehwOwxkRapcdG8HyiK56MIQ4YJWUyN5LIfEbi0qDieKpkDCBoQAxoMMDMxOTc1NzEyMjcwIgwlk51EwTbj8Sl%2Bzokq9gKzSRKERQ%2Ff7km%2FroZ4p5qL%2Fh9QVVbqLAcTlaB46SxOmpTA%2FK4QXiMSAn8gyMejybzL8CFSWot6IETZ%2F7IciELmUgoBxx3uGEpgCirk1a9%2FpeX7pI%2BwsjPPMFLCt9M%2FETcMQU%2BLrVMPLoyoFYcOJbI0sMWS51u0E%2F3Wc2IQuvR7xFZUgCvHYY8ktEzCgm3nknfS3OX23QGeKr%2Bt2kiLuFSMKWOPcEpcI2JQyz%2FzTEIfmZoxHrFpk59gPvgPNTp%2F0t%2FUrjJAh14uPCzHgo1FZCWks5Nuo%2FlPzSwogiCuVNzHpLZ%2FhLDTUOppw9GHffjHiJ%2BMbjyU7LtJE5kOJyFChnuuRhycr81gkZMpZsXtWcK0qI6KIZalScCIQgACuL26E1FOV1glWWDvfD6TLYAZrQvY0gBDj5UlPdTXD%2BoSJUW0NSj%2BuplBEM8UfDN78b9RydI7%2Fo0cEu%2FX9SRkxWgu6r%2FXeAT1tc1uKbJUYu%2F0LZjtWQx7vYifCDDjhfSxBjqcAQLeW21xf9W8hQgo5VczykKrqOYsHysmpnPx%2F3id4gsgLseYMhVTJLV9SLpxgdxw%2FzZJLl2Mywt%2FBlsTVYXjTquEHxNSakr8YVF8SD6QRGqAHUHuTmsNc9Zd14M3%2Ffn5y0xdCbaHXetIMIiGkidlIvPGlit4qK1Qutp6aAhSC6%2B1iaYJnDzWMUWuc2JzvfidBO6gNgcc9HFGTjGiJQ%3D%3D&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=2bec97c10f0051c29d9bb96b8c88f039b7d9cb34d6d105a65218f7327bfef429",
                        "face_photo": "https://truora-files-production.s3.us-east-1.amazonaws.com/validation-filters/processed/TCIa3e34137d4944d68c1f80a1d0444b6a0/TCIa3e34137d4944d68c1f80a1d0444b6a0-663bae9b3e15ef2f941cf356/VLDe6b3d760a850af8eb3cd6ae53e65b00a/frame_1.jpg_watermark.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQO4PGUYHP6KBCZF4%2F20240509%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240509T181848Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCCDjlKIY%2F33yGLcFGfpzR%2FFjeGb67hD9kbK8DrXnERUAIhAIehwOwxkRapcdG8HyiK56MIQ4YJWUyN5LIfEbi0qDieKpkDCBoQAxoMMDMxOTc1NzEyMjcwIgwlk51EwTbj8Sl%2Bzokq9gKzSRKERQ%2Ff7km%2FroZ4p5qL%2Fh9QVVbqLAcTlaB46SxOmpTA%2FK4QXiMSAn8gyMejybzL8CFSWot6IETZ%2F7IciELmUgoBxx3uGEpgCirk1a9%2FpeX7pI%2BwsjPPMFLCt9M%2FETcMQU%2BLrVMPLoyoFYcOJbI0sMWS51u0E%2F3Wc2IQuvR7xFZUgCvHYY8ktEzCgm3nknfS3OX23QGeKr%2Bt2kiLuFSMKWOPcEpcI2JQyz%2FzTEIfmZoxHrFpk59gPvgPNTp%2F0t%2FUrjJAh14uPCzHgo1FZCWks5Nuo%2FlPzSwogiCuVNzHpLZ%2FhLDTUOppw9GHffjHiJ%2BMbjyU7LtJE5kOJyFChnuuRhycr81gkZMpZsXtWcK0qI6KIZalScCIQgACuL26E1FOV1glWWDvfD6TLYAZrQvY0gBDj5UlPdTXD%2BoSJUW0NSj%2BuplBEM8UfDN78b9RydI7%2Fo0cEu%2FX9SRkxWgu6r%2FXeAT1tc1uKbJUYu%2F0LZjtWQx7vYifCDDjhfSxBjqcAQLeW21xf9W8hQgo5VczykKrqOYsHysmpnPx%2F3id4gsgLseYMhVTJLV9SLpxgdxw%2FzZJLl2Mywt%2FBlsTVYXjTquEHxNSakr8YVF8SD6QRGqAHUHuTmsNc9Zd14M3%2Ffn5y0xdCbaHXetIMIiGkidlIvPGlit4qK1Qutp6aAhSC6%2B1iaYJnDzWMUWuc2JzvfidBO6gNgcc9HFGTjGiJQ%3D%3D&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=cce6e27cf4e3ac880e4504b0df937e1fe4fb6b595a5e92f726264e4247ae3b29",
                        "face_photo_watermark": "https://truora-files-production.s3.us-east-1.amazonaws.com/validation-filters/processed/TCIa3e34137d4944d68c1f80a1d0444b6a0/TCIa3e34137d4944d68c1f80a1d0444b6a0-663bae9b3e15ef2f941cf356/VLDe6b3d760a850af8eb3cd6ae53e65b00a/frame_1.jpg_watermark.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQO4PGUYHP6KBCZF4%2F20240509%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240509T181848Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCCDjlKIY%2F33yGLcFGfpzR%2FFjeGb67hD9kbK8DrXnERUAIhAIehwOwxkRapcdG8HyiK56MIQ4YJWUyN5LIfEbi0qDieKpkDCBoQAxoMMDMxOTc1NzEyMjcwIgwlk51EwTbj8Sl%2Bzokq9gKzSRKERQ%2Ff7km%2FroZ4p5qL%2Fh9QVVbqLAcTlaB46SxOmpTA%2FK4QXiMSAn8gyMejybzL8CFSWot6IETZ%2F7IciELmUgoBxx3uGEpgCirk1a9%2FpeX7pI%2BwsjPPMFLCt9M%2FETcMQU%2BLrVMPLoyoFYcOJbI0sMWS51u0E%2F3Wc2IQuvR7xFZUgCvHYY8ktEzCgm3nknfS3OX23QGeKr%2Bt2kiLuFSMKWOPcEpcI2JQyz%2FzTEIfmZoxHrFpk59gPvgPNTp%2F0t%2FUrjJAh14uPCzHgo1FZCWks5Nuo%2FlPzSwogiCuVNzHpLZ%2FhLDTUOppw9GHffjHiJ%2BMbjyU7LtJE5kOJyFChnuuRhycr81gkZMpZsXtWcK0qI6KIZalScCIQgACuL26E1FOV1glWWDvfD6TLYAZrQvY0gBDj5UlPdTXD%2BoSJUW0NSj%2BuplBEM8UfDN78b9RydI7%2Fo0cEu%2FX9SRkxWgu6r%2FXeAT1tc1uKbJUYu%2F0LZjtWQx7vYifCDDjhfSxBjqcAQLeW21xf9W8hQgo5VczykKrqOYsHysmpnPx%2F3id4gsgLseYMhVTJLV9SLpxgdxw%2FzZJLl2Mywt%2FBlsTVYXjTquEHxNSakr8YVF8SD6QRGqAHUHuTmsNc9Zd14M3%2Ffn5y0xdCbaHXetIMIiGkidlIvPGlit4qK1Qutp6aAhSC6%2B1iaYJnDzWMUWuc2JzvfidBO6gNgcc9HFGTjGiJQ%3D%3D&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=cce6e27cf4e3ac880e4504b0df937e1fe4fb6b595a5e92f726264e4247ae3b29"
                      }
                    ],
                    "last_finished_step": {
                      "step_id": "IPSf94d22146f76f38578746e161570a870",
                      "type": "get_validations_result",
                      "verification_output": {
                        "status": "success",
                        "media_uploaded": false,
                        "step_data_received": false
                      },
                      "redirect_url": "",
                      "config": null,
                      "expected_inputs": null,
                      "files_upload_urls": null,
                      "remaining_retries": { "$numberInt": "0" },
                      "async_step": null,
                      "verification_id": "get_validations_result",
                      "start_date": "2024-05-09T18:18:42.876617065Z",
                      "finish_date": "2024-05-09T18:18:42.876659403Z"
                    },
                    "creation_date": "2024-05-09T18:16:50.115558321Z",
                    "update_date": "2024-05-09T18:18:45Z",
                    "geolocation_ip": "19.6647, -101.2791",
                    "ip_address": "177.224.182.194",
                    "city": "Morelia",
                    "geolocation_device": "19.971838648066335, -101.14189434544384",
                    "devices_info": [
                      {
                        "model": "iPhone",
                        "type": "mobile",
                        "os": "iOS",
                        "browser": "WebKit",
                        "browser_version": "605.1.15"
                      }
                    ],
                    "trigger_info": {
                      "channel_name": "web",
                      "channel_type": "unknown",
                      "id": "IPF069df03f568653f11b93daea4b69f44d",
                      "name": "Test-1",
                      "message": "",
                      "media_content_path": "",
                      "trigger_user": "",
                      "response": "",
                      "options": null
                    },
                    "time_to_live": { "$numberInt": "120" },
                    "current_step_index": { "$numberInt": "9" }
                  };


                const register2 = await this.registerService.updateRegister(demoresult);
                return register2;



            }else{

                if(register.status == 'PASO19' || register.status == 'PASO20 - pending'){
                    try {
                        const response = await axios.get(`https://api.identity.truora.com/v1/processes/${process_id}/result?account_id=${userId}`, {
                            headers: {
                                'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                                'Accept': 'application/json'
                            }
                        });

                        // const demozapsign = {
                        //     "process_id": "IDP3ff48c6cbec05873d5c8326d99b8a826",
                        //     "account_id": userId,
                        //     "client_id": "TCIa3e34137d4944d68c1f80a1d0444b6a0",
                        //     "flow_id": "IPF30fb7783937dd805d6127af8517b74c9",
                        //     "created_via": "web",
                        //     "flow_version": 1,
                        //     "country": "ALL",
                        //     "status": "success",
                        //     "validations": [
                        //         {
                        //             "validation_id": "VLD2d93c711310483df8b3a769897e80b53",
                        //             "ip_address": "177.224.181.74",
                        //             "account_id": "663bae9b3e15ef2f941cf356",
                        //             "type": "electronic-signature",
                        //             "validation_status": "success",
                        //             "creation_date": "2024-05-20T21:17:47.160513797Z",
                        //             "details": {
                        //                 "electronic_signature_details": {
                        //                     "original_document_url": "https://zapsign.s3.amazonaws.com/2024/4/docs/05bd1edd-cec7-42ff-8987-c62b723fc623/e82ac0a2-9a3b-4559-906a-7eacf1ce903e.pdf?AWSAccessKeyId=AKIASUFZJ7JCTI2ZRGWX&Signature=6SjqMCU1ge%2Fj%2BO5%2Bby86uhbGlP4%3D&Expires=1716243528",
                        //                     "signed_document_url": "https://zapsign.s3.amazonaws.com/2024/5/pdf/300f5cfe-3da2-47d6-a91b-00cec55b2d40/fcd9094b-2f79-4d38-8cf1-0133cdb005a9.pdf?AWSAccessKeyId=AKIASUFZJ7JCTI2ZRGWX&Signature=HSxwgjYGAct0%2BWGXyDPV225FyUc%3D&Expires=1716243528",
                        //                     "signature_image_url": "https://zapsign.s3.amazonaws.com/2024/5/files/96395551-7372-4659-bc61-8167714a90ce/3c9588e8-3269-4e5d-91e7-d6165f2fb244.png?AWSAccessKeyId=AKIASUFZJ7JCTI2ZRGWX&Signature=e3fDaGOAczDHqN3z7V3pCd0XXS8%3D&Expires=1716243528",
                        //                     "document_id": "b6e94e74-6d1f-459f-8208-0c7244c142e4",
                        //                     "signer_id": "bc2945d0-4daa-4324-a502-9d2880b85eed",
                        //                     "name": "Jorge luis pintor leon",
                        //                     "email": "jorgeleon0028@gmail.com"
                        //                 }
                        //             },
                        //             "identity_process_id": "IDP3ff48c6cbec05873d5c8326d99b8a826"
                        //         }
                        //     ],
                        //     "last_finished_step": {
                        //         "step_id": "IPS5f18f15a74c287b95e00f1077b1ad474",
                        //         "type": "get_signature",
                        //         "verification_output": {
                        //             "status": "success",
                        //             "outputs": [
                        //                 {
                        //                     "value": "electronic-signature",
                        //                     "name": "validation_type"
                        //                 },
                        //                 {
                        //                     "value": "VLD2d93c711310483df8b3a769897e80b53",
                        //                     "name": "validation_id"
                        //                 },
                        //                 {
                        //                     "value": "663bae9b3e15ef2f941cf356",
                        //                     "name": "account_id"
                        //                 }
                        //             ],
                        //             "media_uploaded": true,
                        //             "step_data_received": true
                        //         },
                        //         "redirect_url": "",
                        //         "description": "Ingrese al siguiente enlace para firmar el documento: https://app.zapsign.co/verificar/bc2945d0-4daa-4324-a502-9d2880b85eed",
                        //         "config": {
                        //             "should_update_process_status_on_failure": true,
                        //             "retries": 3,
                        //             "timeout": 0,
                        //             "integration_id": "CIN2196ec41caa1f2721cd317797d760df4",
                        //             "zapsign_id": "7fee8b29-6e88-4161-b9b3-cf5acfe0bfee",
                        //             "zapsign_document_type": "template"
                        //         },
                        //         "expected_inputs": null,
                        //         "files_upload_urls": [
                        //             {
                        //                 "name": "electronic_signature",
                        //                 "url": "https://app.zapsign.co/verificar/bc2945d0-4daa-4324-a502-9d2880b85eed",
                        //                 "description": "Ingrese al siguiente enlace para firmar el documento"
                        //             }
                        //         ],
                        //         "remaining_retries": 0,
                        //         "async_step": null,
                        //         "verification_id": "VRF23d35149_5538_4efe_87bb_3871d56a25e3",
                        //         "start_date": "2024-05-20T21:17:47.22044084Z",
                        //         "finish_date": "2024-05-20T21:18:43.83176284Z"
                        //     },
                        //     "creation_date": "2024-05-20T21:17:31.999967486Z",
                        //     "update_date": "2024-05-20T21:18:45Z",
                        //     "geolocation_ip": "19.7132, -101.2165",
                        //     "ip_address": "177.224.181.74",
                        //     "city": "Morelia",
                        //     "devices_info": [
                        //         {
                        //             "model": "iPhone",
                        //             "type": "mobile",
                        //             "os": "iOS",
                        //             "browser": "WebKit",
                        //             "browser_version": "605.1.15"
                        //         }
                        //     ],
                        //     "trigger_info": {
                        //         "channel_name": "web",
                        //         "channel_type": "unknown",
                        //         "id": "IPF30fb7783937dd805d6127af8517b74c9",
                        //         "name": "ZapSign",
                        //         "message": "",
                        //         "media_content_path": "",
                        //         "trigger_user": "",
                        //         "response": "",
                        //         "options": null
                        //     },
                        //     "time_to_live": 120,
                        //     "current_step_index": 3
                        // }
            
                        
                        const register2 = await this.registerService.updateRegister2(response.data);
                        console.log("STATUS 2: ",register2);
                        if(register2.status == "PASO20 - success" ){
                            console.log("Register paso 20 success");
                            const logged = await this.registerToLogin(register2);
                            let preregister = await this.preregisgterService.getById(register2.account_id);
                            let phone = preregister.phoneCode + preregister.phone;
                            console.log("SENDING NOTIFICATIONS");
                            console.log("EMAIL:",preregister.email);
                            console.log("PHONE:",phone);
                            await this.notificationService.sendEmailGeneric(preregister.email, `Hola ${register2.Truora.first_name}!, Tu registro en Trasmisora ha sido exitoso, ya puedes ingresar con tus credenciales.`,'Trasmisora, registro exitoso!');
                            await this.notificationService.sendSMSGeneric(phone, `Hola ${register2.Truora.first_name}!, Tu registro en Trasmisora ha sido exitoso, ya puedes ingresar con tus credenciales.`);

                            return register2;
                        }else{
                        return register2; // Return the response data to be used in the controller
                        }
                    } catch (error) {
                        console.log("ERROR: ",error);
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

    getTruoraStatusPM = async (userId: string): Promise<any> => {
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
        
                    console.log("Return: ", response.data);
                    const register2 = await this.registerService.updateRegister(response.data);
        
                    return register2; // Return the response data to be used in the controller
                } catch (error) {
                    return register;
                }

                const demoresult = {
                    "process_id": "IDPdd377e2659c344ea28347c478b72ee8d",
                    "account_id": userId,
                     "client_id": 'TCIa3e34137d4944d68c1f80a1d0444b6a0',
                        "flow_id": 'IPF82d69731a9307f4b0131820c84138284',
                        "created_via": 'web',
                        "flow_version": 12,
                        "country": 'ALL',
                        "status": 'success',
                        "last_finished_step": {
                          "step_id": 'IPS86937b7df8ab618d508c7aea36996c14',
                          "type": 'enter_geolocation_permissions',
                          "verification_output": {
                            "status": 'success',
                            "outputs": [Array],
                            "media_uploaded": false,
                            "step_data_received": true
                          },
                          "redirect_url": '',
                          "config": {
                            "should_update_process_status_on_failure": true,
                            "retries": 3,
                            "timeout": 0
                          },
                          "expected_inputs": [ [Object], [Object] ],
                          "files_upload_urls": null,
                          "remaining_retries": 0,
                          "async_step": null,
                          "start_date": '2024-06-07T04:18:49.798697515Z',
                          "finish_date": '2024-06-07T04:18:50.702252323Z'
                        },
                        "creation_date": '2024-06-07T04:18:43.325738099Z',
                        "update_date": '2024-06-07T04:18:52Z',
                        "geolocation_ip": '19.6404, -101.1825',
                        "ip_address": '187.195.72.242',
                        "city": 'Morelia',
                        "geolocation_device": '19.7197824, -101.203968',
                        "devices_info": [
                          {
                            "type": 'computer',
                            "os": 'Windows',
                            "os_version": '15.0.0',
                            "browser": 'Chrome',
                            "browser_version": '125.0.0.0'
                          }
                        ],
                        "trigger_info": {
                          "channel_name": 'web',
                          "channel_type": 'unknown',
                          "id": 'IPF82d69731a9307f4b0131820c84138284',
                          "name": 'PFCMS',
                          "message": '',
                          "media_content_path": '',
                          "trigger_user": 'antonio.ayala@uexchange.money',
                          "response": '',
                          "options": null
                        },
                        "time_to_live": 120,
                        "current_step_index": 2
                      
                  };


                const register2 = await this.registerService.updateRegister(demoresult);
                return register2;



            }else{

                if(register.status == 'FIRMA_DECLARACION' || register.status == 'FIRMA_DECLARACION - pending'){
                    try {
                        const response = await axios.get(`https://api.identity.truora.com/v1/processes/${process_id}/result?account_id=${userId}`, {
                            headers: {
                                'Truora-API-Key': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiIiwiYWRkaXRpb25hbF9kYXRhIjoie30iLCJjbGllbnRfaWQiOiJUQ0lhM2UzNDEzN2Q0OTQ0ZDY4YzFmODBhMWQwNDQ0YjZhMCIsImV4cCI6MzI4NjQxMjkwMywiZ3JhbnQiOiIiLCJpYXQiOjE3MDk2MTI5MDMsImlzcyI6Imh0dHBzOi8vY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb20vdXMtZWFzdC0xX0szZUREaExmNiIsImp0aSI6Ijc2ZWZhYTA5LTQzZTUtNDBkOS1iYTgwLTYyMjQ1NDlkOWYxNyIsImtleV9uYW1lIjoidGVzdC0xIiwia2V5X3R5cGUiOiJiYWNrZW5kIiwidXNlcm5hbWUiOiJ0cmFzbWlzb3JhLXRlc3QtMSJ9.bomFmfqkZMv-qwNBfrGdb6sWlRktmn7-Cn3ZctFhGds",
                                'Accept': 'application/json'
                            }
                        });

                        // const demozapsign = {
                        //     "process_id": "IDP3ff48c6cbec05873d5c8326d99b8a826",
                        //     "account_id": userId,
                        //     "client_id": "TCIa3e34137d4944d68c1f80a1d0444b6a0",
                        //     "flow_id": "IPF30fb7783937dd805d6127af8517b74c9",
                        //     "created_via": "web",
                        //     "flow_version": 1,
                        //     "country": "ALL",
                        //     "status": "success",
                        //     "validations": [
                        //         {
                        //             "validation_id": "VLD2d93c711310483df8b3a769897e80b53",
                        //             "ip_address": "177.224.181.74",
                        //             "account_id": "663bae9b3e15ef2f941cf356",
                        //             "type": "electronic-signature",
                        //             "validation_status": "success",
                        //             "creation_date": "2024-05-20T21:17:47.160513797Z",
                        //             "details": {
                        //                 "electronic_signature_details": {
                        //                     "original_document_url": "https://zapsign.s3.amazonaws.com/2024/4/docs/05bd1edd-cec7-42ff-8987-c62b723fc623/e82ac0a2-9a3b-4559-906a-7eacf1ce903e.pdf?AWSAccessKeyId=AKIASUFZJ7JCTI2ZRGWX&Signature=6SjqMCU1ge%2Fj%2BO5%2Bby86uhbGlP4%3D&Expires=1716243528",
                        //                     "signed_document_url": "https://zapsign.s3.amazonaws.com/2024/5/pdf/300f5cfe-3da2-47d6-a91b-00cec55b2d40/fcd9094b-2f79-4d38-8cf1-0133cdb005a9.pdf?AWSAccessKeyId=AKIASUFZJ7JCTI2ZRGWX&Signature=HSxwgjYGAct0%2BWGXyDPV225FyUc%3D&Expires=1716243528",
                        //                     "signature_image_url": "https://zapsign.s3.amazonaws.com/2024/5/files/96395551-7372-4659-bc61-8167714a90ce/3c9588e8-3269-4e5d-91e7-d6165f2fb244.png?AWSAccessKeyId=AKIASUFZJ7JCTI2ZRGWX&Signature=e3fDaGOAczDHqN3z7V3pCd0XXS8%3D&Expires=1716243528",
                        //                     "document_id": "b6e94e74-6d1f-459f-8208-0c7244c142e4",
                        //                     "signer_id": "bc2945d0-4daa-4324-a502-9d2880b85eed",
                        //                     "name": "Jorge luis pintor leon",
                        //                     "email": "jorgeleon0028@gmail.com"
                        //                 }
                        //             },
                        //             "identity_process_id": "IDP3ff48c6cbec05873d5c8326d99b8a826"
                        //         }
                        //     ],
                        //     "last_finished_step": {
                        //         "step_id": "IPS5f18f15a74c287b95e00f1077b1ad474",
                        //         "type": "get_signature",
                        //         "verification_output": {
                        //             "status": "success",
                        //             "outputs": [
                        //                 {
                        //                     "value": "electronic-signature",
                        //                     "name": "validation_type"
                        //                 },
                        //                 {
                        //                     "value": "VLD2d93c711310483df8b3a769897e80b53",
                        //                     "name": "validation_id"
                        //                 },
                        //                 {
                        //                     "value": "663bae9b3e15ef2f941cf356",
                        //                     "name": "account_id"
                        //                 }
                        //             ],
                        //             "media_uploaded": true,
                        //             "step_data_received": true
                        //         },
                        //         "redirect_url": "",
                        //         "description": "Ingrese al siguiente enlace para firmar el documento: https://app.zapsign.co/verificar/bc2945d0-4daa-4324-a502-9d2880b85eed",
                        //         "config": {
                        //             "should_update_process_status_on_failure": true,
                        //             "retries": 3,
                        //             "timeout": 0,
                        //             "integration_id": "CIN2196ec41caa1f2721cd317797d760df4",
                        //             "zapsign_id": "7fee8b29-6e88-4161-b9b3-cf5acfe0bfee",
                        //             "zapsign_document_type": "template"
                        //         },
                        //         "expected_inputs": null,
                        //         "files_upload_urls": [
                        //             {
                        //                 "name": "electronic_signature",
                        //                 "url": "https://app.zapsign.co/verificar/bc2945d0-4daa-4324-a502-9d2880b85eed",
                        //                 "description": "Ingrese al siguiente enlace para firmar el documento"
                        //             }
                        //         ],
                        //         "remaining_retries": 0,
                        //         "async_step": null,
                        //         "verification_id": "VRF23d35149_5538_4efe_87bb_3871d56a25e3",
                        //         "start_date": "2024-05-20T21:17:47.22044084Z",
                        //         "finish_date": "2024-05-20T21:18:43.83176284Z"
                        //     },
                        //     "creation_date": "2024-05-20T21:17:31.999967486Z",
                        //     "update_date": "2024-05-20T21:18:45Z",
                        //     "geolocation_ip": "19.7132, -101.2165",
                        //     "ip_address": "177.224.181.74",
                        //     "city": "Morelia",
                        //     "devices_info": [
                        //         {
                        //             "model": "iPhone",
                        //             "type": "mobile",
                        //             "os": "iOS",
                        //             "browser": "WebKit",
                        //             "browser_version": "605.1.15"
                        //         }
                        //     ],
                        //     "trigger_info": {
                        //         "channel_name": "web",
                        //         "channel_type": "unknown",
                        //         "id": "IPF30fb7783937dd805d6127af8517b74c9",
                        //         "name": "ZapSign",
                        //         "message": "",
                        //         "media_content_path": "",
                        //         "trigger_user": "",
                        //         "response": "",
                        //         "options": null
                        //     },
                        //     "time_to_live": 120,
                        //     "current_step_index": 3
                        // }
            
                        
                        const register2 = await this.registerService.updateRegister2PM(response.data);
                        // if(register2.status == "FIRMA_DECLARACION - success" ){
                        //     const logged = await this.registerToLogin(register2);
                        //     let preregister = await this.preregisgterService.getById(register2.account_id);
                        //     let phone = preregister.phoneCode + preregister.phone;
                        //     await this.notificationService.sendEmailGeneric(preregister.email, `Hola !, Tu registro en Trasmisora ha sido exitoso, puedes ingresar con tus credenciales`,'Trasmisora, registro exitoso!');
                        //     await this.notificationService.sendSMSGeneric(phone, `Hola !, Tu registro en Trasmisora ha sido exitoso, puedes ingresar con tus credenciales`);


                        //     return register2;
                        // }else{
                        // return register2; // Return the response data to be used in the controller
                        // }
                        return register2;
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

    registerToLogin = async (Registerobj: any) => {


        let preregister = await this.preregisgterService.getById(Registerobj.account_id);
        let userDb = await this.repository.getByEmail(preregister.email);


        // if (userDb !== null)
        //     throw new Error(MSG_EMAIL_ALREADY_REGISTERED);

        // Verifica si el email o teléfono ha sido verificado.
        // const verify = await this.verifyService.getById(Registerobj.verify._id);
        // if (verify === null)
        //     throw new Error('MSG_EMAIL_ALREADY_REGISTERED');

        // TODO: Validar si existen los catálogos.        

        
        const hashedPassword = await bcrypt.hash(Registerobj.data_obtenida.pass, 10);
      
        const adress:any = {
            country:Registerobj.data_obtenida.pais,
            state:Registerobj.data_obtenida.endidad_mx,
            municipality:Registerobj.data_obtenida.municipio_mx,
            city:Registerobj.data_obtenida.ciudad_poblacion,
            suburb:Registerobj.data_obtenida.colonia_mx,
            street:Registerobj.data_obtenida.calle_mx,
            cp:Registerobj.data_obtenida.cp_mx,
            phoneNumber:preregister.phoneCode + preregister.phone,
            email:preregister.email,
            constitutionDate: new Date()
        };
        let useradress = await this.addressRepository.create(adress)


        let rol = Registerobj.data_obtenida.tipopersona ? Registerobj.data_obtenida.tipopersona : "PERSONA_FISICA";
        let datosempresa = null;
        if(Registerobj.prev_register.length > 0){
            console.log("Prev register: ",Registerobj.prev_register[0]);
            let prev_register = await this.registerService.getByIdfull(Registerobj.prev_register[0]);
            console.log("Prev object: ",prev_register);
            rol = prev_register.data_obtenida.tipopersona;
            datosempresa = prev_register.data_obtenida;
            datosempresa["files"] = prev_register.files;
            datosempresa["truora"] = prev_register.Truora;
            datosempresa["ZapSign"] = prev_register.ZapSign;
            
        }
        
        let user = {
            roles:[rol],
            "isActive": true,
            "isComplete": true,
            "isAdminVerified": true,
            "isCellPhonVerified": false,
            "isEmailVerified": true,
            "RegistrationStage": "STP_REGISTER",
            "address": [
                useradress
            ],
            "businessAddress": [],
            "administrators": [],
            "files": Registerobj.files,
            "balance": 0,
            "balanceUSD": 0,
            "devices": [
            ],
            "cards": [],
            "domicileAt": Registerobj.data_obtenida.residence,
            "email": preregister.email,
            "phoneCode":preregister.phoneCode,
            "phone":preregister.phone,
            "language": "63bf7b31867c93050b5f191d"
            ,
            "nationality": Registerobj.data_obtenida.nacionalidad,
            "password": hashedPassword,
            "birthdate": new Date(Registerobj.Truora.validations[0].details.document_details.date_of_birth),
            "countryOfBirth": Registerobj.Truora.validations[0].details.document_details.country,
            "curp": Registerobj.Truora.validations[0].details.document_details.document_number,
            "emailSecondary": "",
            "federalEntityOfBirth": "",
            "firstName": (Registerobj.Truora.validations[0].details.document_details.name ),
            "gender": Registerobj.Truora.validations[0].details.document_details.gender,
            "lastName": Registerobj.Truora.validations[0].details.document_details.first_last_name,
            "mothersLastName": Registerobj.Truora.validations[0].details.document_details.second_last_name,
            "occupation":  Registerobj.data_obtenida.ocupacion ,
            "avatar": Registerobj.data_obtenida.avatar,
            "color": Registerobj.data_obtenida.fondo_avatar,
            "userName": Registerobj.data_obtenida.nombre_usuario,
            "identificationNumber": Registerobj.Truora.validations[0].details.document_details.machine_readable,
            "identificationType": Registerobj.Truora.validations[0].details.document_details.document_type,
            "signature": Registerobj.ZapSign.validations[0].details.electronic_signature_details.signed_document_url,
            "pinCode": 111111,
            "failedLoginAttempts": 0,
            "isBlocked": false,
            "status": "PENDING",
            "isDeleted": false,
            "registerid": Registerobj._id,
            "nivel": Registerobj.data_obtenida.monto_vol > 2 ? 3 : 2,
            "datosempresa":datosempresa
        }



        userDb = await this.repository.create({ ...user});

        // TODO: Enviar OTP.
        // this.optService.request(userDb, OTPType.VERIFY_ACCOUNT);

        const tokenData = this.createToken(userDb);
        const token = tokenData.token;

        return {
            ...userDb._doc,
            token
        };

        // return ({})


    }


    updateTruoraRegister = async (userId: string, data: any,status:string): Promise<any> => {
        try{
            console.log('userId', userId);
            console.log('data', data);
            const register = await this.registerService.updateStatusByAccountId(userId, data,status);
            if(register.data_obtenida.tipopersona != "PERSONA_MORAL" ){
                if(status.toUpperCase() == "PASO15B" || status.toUpperCase() == "PASO16B"){


                    const telefonoCompleto = data.celular_proveedor;
                    const codigoPais = telefonoCompleto.substring(0, 3); // "+52"
                    const numero = telefonoCompleto.substring(3); // "4431967999"

                    let tipo_preregistro = 1;
                    if(status.toUpperCase() == "PASO16B"){
                        tipo_preregistro = 2;
                    }
                    console.log(codigoPais); // "+52"
                    console.log(numero); // "4431967999"
                    const intialObject = new Preregisters({
                        phoneCode: codigoPais,
                        phone: numero,
                        email: data.email_proveedor,
                        tipo: tipo_preregistro
                    });

                    const userdata: RecoverPasswordDto = {
                        phoneCode: codigoPais,
                        phone: numero,
                        email: data.email_proveedor
                    };
                    const oldregister = await this.preregisgterService.getByPhoneAndEmail(userdata);

                    var _id = "NOID";
                    if (oldregister !== null){
                        console.log("Has preregister!");
                        _id = oldregister.id;
                        // return register;
                    }else{
                        const register2 = await this.preregisgterService.create(intialObject);
                        _id = register2.id;
                    }
                    await this.notificationService.sendEmail2(data.email_proveedor, "https://www.cms.trasmisora.com/deeplink?userid="+_id+"?tipoproveedor="+data.tipo_proveedor+"?email="+encodeURIComponent(data.email_proveedor)+"?phone="+encodeURIComponent(data.celular_proveedor)+"?tipo="+tipo_preregistro+"?registroprev="+register._id);
                    await this.notificationService.sendSMS2(data.celular_proveedor, "https://www.cms.trasmisora.com/deeplink?userid="+_id+"?tipoproveedor="+data.tipo_proveedor+"?email="+encodeURIComponent(data.email_proveedor)+"?phone="+encodeURIComponent(data.celular_proveedor)+"?tipo="+tipo_preregistro+"?registroprev="+register._id);
                }

            }else{
                if(status.toUpperCase() == "ORIGEN_FONDOS"){
                            // const logged = await this.registerToLogin(register);
                            let preregister = await this.preregisgterService.getById(register.account_id);
                            let phone = preregister.phoneCode + preregister.phone;
                            await this.notificationService.sendEmailGeneric(preregister.email, `Hola !, ingresa a para terminar tu registro: "https://www.cms.trasmisora.com/deeplink?userid=${preregister.id}?tipoproveedor=${0}?email=${encodeURIComponent(preregister.email)}?phone=${encodeURIComponent(phone)}?tipo=0?registroprev=${register._id})`,'Trasmisora, registro pendiente!');
                            await this.notificationService.sendSMSGeneric(phone, `Hola !, ingresa a para terminar tu registro: "https://www.cms.trasmisora.com/deeplink?userid=${preregister.id}?tipoproveedor=${0}?email=${encodeURIComponent(preregister.email)}?phone=${encodeURIComponent(phone)}?tipo=0?registroprev=${register._id})`);
                            // return register;

                }
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
    getbyCLABE = async (clabe:string,status:string) => {
        let user = await this.repository.getbyCLABE(clabe);
        return user;
    }

    getaccountnumber = async (clabe:string,status:string) => {
        let user = await this.repository.getallWClabe();
        console.log("Users w Clabe: ",user);
        return user.length + 1;
    }
  



    changestatuscuenta = async (clabe:string,status:string) => {
        let user = await this.repository.getbyCLABE(clabe);
        if(user != null){
            if(status == "A"){
            user.clabeactive = true;
            }else{
            user.clabeactive = false;
            }
            
            return await this.repository.update(user);
        }else{
            throw new Error('Error al encontrar la cuenta');
        }
    }


    activatestatus = async (id:string,clabe) => {
        let user = await this.repository.getById(id);
        user.isActive = true;
        user.clabeactive = true;
        user.status = "ACTIVE";
        user.RegistrationStage = "FINISHED";
        user.clabe = clabe;
        return await this.repository.update(user);
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
            token: jwt.sign(dataStoredInToken, SECRET, { }),
        };
    }

    AddFiletoRegister = async (userId: string,fileid:string,type:string): Promise<any> => {
        try{
            const register = await this.registerService.getByIdfull(userId);
            
            if (register === null){
                throw new Error('PROCESS NOT FOUND');
            }
            
             // Asegurarse de que el array files exista, si no, crearlo
            if (!register.files) {
                register.files = [];
            }
            
            const existingFileIndex = register.files.findIndex(file => file.type === type);

            if (existingFileIndex !== -1) {
                // Si existe un archivo del mismo tipo, sobrescribirlo
                register.files.splice(existingFileIndex, 1);
            }

            register.files.push(fileid);

            register.status = "UPLOAD_FILES";

            // Guardar los cambios en la base de datos
            await register.save();
            const register2 = await this.registerService.getStatusByAccountId(userId);
            return register2; 
           

          
        }catch (error){
            console.error('Error register files', error.message);
            throw new Error(error.message);
        }   
    }

    updateByAccountId = async (id: string, firstName:string,lastName:string,mothersLastName:string,status:number,password:string,email:string) =>
    {
        return await this.repository.updateByAccountId(id,firstName,lastName,mothersLastName,status,password,email);
    }

    getbyregisteridandupdateblock = async (id: string,status:boolean) =>
    {
        let user = await this.repository.getbyregisterid(id);
        console.log("User finded: ", user);
        if(user){
            user.isBlocked = status;
            await user.save();
        }
        return user
        
    }


}

export default UserService;
