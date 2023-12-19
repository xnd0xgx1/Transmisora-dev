import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import DataStoredInToken from '../interfaces/dataStoredInToken';
import userModel from '../models/User';
import { SECRET } from '../common/constants';
import NotAuthorizedException from '../exceptions/NotAuthorizedException';
import DeviceNotFoundException from '../exceptions/DeviceNotFoundException';
import NotDeviceIdException from '../exceptions/NotDeviceIdException copy';
import DeviceSessionExpiredException from '../exceptions/DeviceSessionExpiredException';

async function authMiddleware(Role: string[], validateDevice: boolean = true) {
    return async function (request: any, response: Response, next: NextFunction) {
        if (request.headers.authorization) {
            var token = request.headers.authorization.split(' ')[1];
            const deviceId = request.headers.device;
            try {
                const verificationResponse = jwt.verify(token, SECRET) as DataStoredInToken;
                const id = verificationResponse.id;
                const user: any = await userModel.findById(id).populate('picture administrators devices address businessAddress files language signature cards');                
                if (user) {
                    let hasRol = false;
                    user.roles.forEach((rol: any) => {
                        if (Role.includes(rol)) {
                            hasRol = true;
                        }
                    });
                    if (!hasRol) {
                        next(new NotAuthorizedException());
                        return;
                    }
                    request.user = user;

                    if (validateDevice && user.roles[0] !== 'ADMIN') {
                        if (deviceId === undefined) {
                            next(new NotDeviceIdException());
                            return;
                        }
                        const device = user.devices.find((x: any) => x._id.toString() === deviceId);
                        if (device === undefined){
                            next(new DeviceNotFoundException());
                            return;
                        }
                        if(device.activeSesion === false){
                            next(new DeviceSessionExpiredException());
                            return;
                        }
                        request.device = device;
                    }

                    next();
                } else {
                    next(new WrongAuthenticationTokenException());
                }
            } catch (error) {
                console.log(error);
                next(new WrongAuthenticationTokenException());
            }
        } else {
            next(new AuthenticationTokenMissingException());
        }
    }
}
export default authMiddleware;
