//create an auth middleware for the cms
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import AuthenticationTokenMissingException from '../exceptions/AuthenticationTokenMissingException';
import WrongAuthenticationTokenException from '../exceptions/WrongAuthenticationTokenException';
import DataStoredInTokenCMS from '../interfaces/dataStoredInTokenCMS';
import { SECRET } from '../common/constants';
import NotAuthorizedException from '../exceptions/NotAuthorizedException';

async function authMiddlewareCMS(Role: string[]){
    return async function (request:any, response: Response, next: NextFunction){
        if (request.headers.authorization) {
            var token = request.headers.authorization.split(' ')[1];
            try {
                const verificationResponse = jwt.verify(token, SECRET) as DataStoredInTokenCMS;
                if (Role.includes(verificationResponse.role)) {
                    request.user = verificationResponse;
                    next();
                } else {
                    next(new NotAuthorizedException());
                }
            } catch (error) {
                next(new WrongAuthenticationTokenException());
            }
        } else {
            next(new AuthenticationTokenMissingException());
        }
    }
}
export default authMiddlewareCMS;
