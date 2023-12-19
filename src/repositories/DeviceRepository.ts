import { BaseRepository } from './base/BaseRepository';
import Device from '../models/Device';

class DeviceRepository extends BaseRepository<typeof Device> {
    getByUserAndDeviceToken = async (user: any, deviceToken: any) => {
        return await Device.findOne({ user: user._id, deviceToken: deviceToken });
    }
}

export default DeviceRepository;
