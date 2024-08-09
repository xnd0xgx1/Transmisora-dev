import BaseService from "./base/BaseService";
import Device from "../models/Device";
import DeviceRepository from "../repositories/DeviceRepository";
import UserService from "./UserService";
import Role from "../enums/Role";
import NotificationService from "./NotificationService";
import { getText } from "../common/Utilities";
import TextType from "../enums/TextType";

class DeviceService extends BaseService<DeviceRepository> {

    private userService;
    private notificationService = new NotificationService();

    constructor(userService: UserService) {
        super(new DeviceRepository(Device));
        this.userService = userService;
    }

    addDevice = async (user: any, device: any) => {

        let verificationCode = '';
        let deviceDb = await this.repository.getByUserAndDeviceToken(user, device.deviceToken);        
        if(deviceDb === null){
            verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            device.verifyCode = verificationCode;
            device.user = user._id;
            deviceDb = await this.create(device);
            user.devices.push(deviceDb);
            await this.userService.update(user);            
        }
        else 
            verificationCode = deviceDb.verifyCode;        

        // SEND VERIFY SMS.        
        await this.sendVerificationCode(user, device, verificationCode);        
        
        deviceDb.verifyCode = undefined;
        return deviceDb;
    }

    resendVerifyCode = async (user:any, device:any, deviceId: any) => {
        let deviceDb = await this.repository.getById(deviceId);
        await this.sendVerificationCode(user, device, deviceDb.verifyCode);
        return deviceDb.verifyCode;
    }

    verifyDevice = async (user: any, deviceId: any, verifyCode: any) => {
        let deviceDb = await this.repository.getById(deviceId);
        
        // TODO: Validar ya está verificado.
        // TODO: Validar ei el dispositovo es del usuario.
        if (deviceDb.verifyCode !== verifyCode)
            throw new Error(getText(TextType.BAD_CODE));

        deviceDb.isVerify = true;
        deviceDb.activeSesion = true;

        await this.repository.update(deviceDb);
        deviceDb.verifyCode = undefined;
        return deviceDb;
    }

    updateDevice = async (user: any, deviceId: any, device: any) => {
        let deviceDb = await this.repository.getById(deviceId);
        // TODO: Validar ei el dispositovo es del usuario.
        deviceDb.deviceToken = device.deviceToken;
        deviceDb.info = device.info;

        await this.repository.update(deviceDb);
        return deviceDb;
    }

    startSession = async (user: any, deviceId: any) => {
        let deviceDb = await this.repository.getById(deviceId);
        // TODO: Validar ei el dispositovo es del usuario.

        deviceDb.sessionDate = new Date();
        deviceDb.activeSesion = true;
        if(deviceDb.user === undefined)
            deviceDb.user = user._id;
        deviceDb = await this.repository.update(deviceDb);
        return deviceDb;
    }

    finishSession = async (user: any, deviceId: any) => {
        let deviceDb = await this.repository.getById(deviceId);
        // TODO: Validar ei el dispositovo es del usuario.

        // TODO: Validar si ya existe una sesión activa.

        deviceDb.sessionDate = new Date();
        deviceDb.activeSesion = false;
        await this.repository.update(deviceDb);
        return deviceDb;
    }

    closeAllSessions = async (user: any, currentDevice: any) => {
        // TODO: Validar ei el dispositovo es del usuario.

        for (let i = 0; i < user.devices.length; i++) {
            let device = user.devices[i];
            if (device._id !== currentDevice._id) {
                if (device.activeSesion) {
                    device.activeSesion = false;
                    device.sessionDate = new Date();
                    await this.update(device);
                }
            }
        }
    }

    getAllActiveSessions = async (user: any) => {
        let devices = user.devices.filter((x: any) => x.activeSesion === true);
        return devices.length;
    }

    private sendVerificationCode = async (user: any, device: any, verificationCode: any) => {
        if (device.sendVerificationCodeToPrimary) {
            
            await this.notificationService.sendEmail(user.email, verificationCode);
        }
        else {
          
                    await this.notificationService.sendSMS(`${user.phoneCode}${user.phone}`, verificationCode)
        }
        return verificationCode
    }
}

export default DeviceService;
