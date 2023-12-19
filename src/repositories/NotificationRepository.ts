import { BaseRepository } from './base/BaseRepository';
import Notification from '../models/Notification';

class NotificationRepository extends BaseRepository<typeof Notification> {
    getAllByUser = async (user: any) => {
        return await Notification.find({ user: user });
    }

    getAllSystem = async () => {
        return await Notification.find({ isSystem: true });
    }
}

export default NotificationRepository;
