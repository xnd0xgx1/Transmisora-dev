import OTP from '../models/OTP';
import { BaseRepository } from './base/BaseRepository';

class OtpRepository extends BaseRepository<typeof OTP> {
    getByCode = async (code: any) => {
        return await OTP.findOne({ code: code }).sort({$natural:-1});
    }
}

export default OtpRepository;
