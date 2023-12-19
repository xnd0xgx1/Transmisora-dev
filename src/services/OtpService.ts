import BaseService from "./base/BaseService";
import OtpRepository from "../repositories/OtpRepository";
import OTPType from "../enums/OtpType";
import OTP from "../models/OTP";
import VerifyDto from "../dto/VerifyDto";
import NotificationService from "./NotificationService";

class OtpService extends BaseService<OtpRepository> {

    private notificationService = new NotificationService();

    constructor() {
        super(new OtpRepository(OTP));
    }

    request = async (user: any = null, otpType: OTPType, value: string) => {

        //const code = Math.floor(100000 + Math.random() * 900000);
        const code = '123456';

        const otp = await this.repository.create({
            user,
            otpType,
            code: code // TODO: Generar.
        });

        // Send email or SMS
        // if(value.includes('@'))
        //     await this.notificationService.sendEmail(value, code);
        // else
        //     await this.notificationService.sendSMS(value, code);

        return otp;
    }

    requestActive = async (user: any = null, otpType: OTPType, value: string) => {

        const code = Math.floor(100000 + Math.random() * 900000);

        const otp = await this.repository.create({
            user,
            otpType,
            code: code
        });

        // Send email or SMS
        if(value.includes('@'))
            await this.notificationService.sendEmail(value, code);
        else
            await this.notificationService.sendSMS(value, code);

        return otp;
    }

    verify = async (verifyDto: VerifyDto) => {
        //const otp = await this.repository.getByCode({});

        // TODO: Verificar e incrementar numerador de intentos.

        // TODO: Marcar código como usado.
        let code = await this.repository.getByCode(verifyDto.code);
        console.log(verifyDto.code);
        if (code === null)
            throw new Error('Código incorrecto');

        code.isUsed = true;
        await this.repository.update(code);

        return true;
    }

    verifyOTP = async (verifyDto: VerifyDto) => {
        // TODO: Verificar e incrementar numerador de intentos.
        let code = await this.repository.getByCode(verifyDto.code);
        if (code === null)
            throw new Error('Código incorrecto');
        return code;
    }
}

export default OtpService;
