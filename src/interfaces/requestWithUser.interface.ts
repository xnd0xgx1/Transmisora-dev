import { Request } from 'express';
import IUser from './IUser';

interface RequestWithUser extends Request {
    createdAt: Date;
    user: IUser;
}

export default RequestWithUser;
