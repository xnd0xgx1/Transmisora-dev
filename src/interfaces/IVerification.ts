import StatusVerification from "../enums/StatusVerification";

interface IVerification {
    id?: string;
    createdAt?: Date,
    useDate?: Date,
    user: string,
    code: string,
    attempts?: number
    statusVerification?: StatusVerification
}

export default IVerification;
