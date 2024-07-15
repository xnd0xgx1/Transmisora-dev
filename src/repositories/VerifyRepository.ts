import { BaseRepository } from './base/BaseRepository';
import Verify from '../models/Verify';

class VerifyRepository extends BaseRepository<typeof Verify> {
    getByValue = async (value: string) => {
        return await Verify.findOne({ value: value }).sort({ $natural: -1 }).populate({
            path: 'otp'
        });
    }
    getByValueAndCode = async (value: string, code: string) => {
        const verifications: any = await Verify.find({ value: value }).sort({ $natural: -1 }).populate('otp');
        const verification = verifications.find((x: any) => x.otp.code === code);
        return verification;
    }
}

export default VerifyRepository;
