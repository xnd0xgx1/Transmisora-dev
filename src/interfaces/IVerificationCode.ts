import IUser from "./IUser";

interface IVerificationCode {
    _id?: string;
    createdAt?: Date;
    code: string;
    isValid?: string;
    user: IUser;
}

export default IVerificationCode;
