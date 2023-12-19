import { Schema, model } from 'mongoose';
import INotification from '../interfaces/INotification';

const schema = new Schema<INotification>({
    isRead: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    body: { type: String }
}, { timestamps: true });

const Notification = model<INotification>('Notification', schema, 'notifications');
export default Notification;
