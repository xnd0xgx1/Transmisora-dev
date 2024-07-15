import OtpType from '../enums/OtpType';
import OTP from '../models/OTP';
import { BaseRepository } from './base/BaseRepository';

class OtpRepository extends BaseRepository<typeof OTP> {
    getByCode = async (code: any) => {
        return await OTP.findOne({ code: code }).sort({$natural:-1});
    }
    getByCodeandType = async (code: any,type:OtpType) => {
        return await OTP.findOne({ code: code ,otpType:type}).sort({$natural:-1});
    }
}

export default OtpRepository;
