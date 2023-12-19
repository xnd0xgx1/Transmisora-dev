import BaseService from "./base/BaseService";
import VerifyRepository from "../repositories/VerifyRepository";
import Verify from "../models/Verify";
import OtpService from "./OtpService";
import OtpType from "../enums/OtpType";
import VerifyDto from "../dto/VerifyDto";
import VerifyRequestDto from "../dto/VerifyRequestDto";

class VerifyService extends BaseService<VerifyRepository> {

    private otpService = new OtpService();

    constructor() {
        super(new VerifyRepository(Verify));
    }

    request = async (verifyRequestDto: VerifyRequestDto, type: OtpType, user: any = null) => {

        // TODO: Verificar si ya existe un registro validado de ese elemento.
        if (type === OtpType.VERIFY_EMAIL_PASSWORD) {
            const verifyDb = await this.repository.getByValue(verifyRequestDto.value);
            if (verifyDb !== null) {
                if (verifyDb.isVerified)
                    throw new Error('Ya se ha verificado este valor.');
            }
        }

        let otp;

        // Enviar OTP.
        if (type === OtpType.VERIFY_EMAIL_PASSWORD) {
            otp = await this.otpService.request(user, type, verifyRequestDto.value);
        }
        else {
            otp = await this.otpService.requestActive(user, type, verifyRequestDto.value);
        }

        await this.repository.create({
            value: verifyRequestDto.value,
            otp: otp
        });
    }

    verify = async (verifyDto: VerifyDto) => {
        // TODO: Verificar e incrementar numerador de intentos.
        // TODO: Verificar la fecha.
        // TODO: Marcar código como usado.
        let verifyDb = await this.repository.getByValueAndCode(verifyDto.value, verifyDto.code);
        if (verifyDb === undefined)
            throw new Error('Datos de verificación incorrectos');

        if (verifyDb.isVerified)
            throw new Error('Ya se ha utilizado esta verificación');

        // let codeDb = await this.otpService.verify(verifyDto);
        // if (codeDb === null)
        //     throw new Error('Código incorrecto');

        // TODO: Set opt as used, incremnt attmps

        verifyDb.isVerified = true;
        verifyDb.verifiedAt = new Date();
        verifyDb = await this.repository.update(verifyDb);

        return verifyDb;
    }

    getById = async (id: any) => {
        return await this.repository.getById(id);
    }

    getByValue = async (value: any) => {
        return await this.repository.getByValue(value);
    }

    delete = async (id: any) => {
        return await this.repository.delete(id);
    }
}

export default VerifyService;
