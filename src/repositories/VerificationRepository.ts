import StatusVerification from "../enums/StatusVerification";
import IUser from "../interfaces/IUser";
import IVerification from "../interfaces/IVerification";
import User from "../models/User";
import Verification from "../models/Verification";

export default class VerificationRepository {

    constructor() { }

    // getAll = async () => {
    //     return User.find();
    // }

    // getById = async (id: string) => {
    //     return User.findOne({ _id: id });
    // }

    // update = async (user: any) => {
    //     var userDb = await User.findOne({ _id: user.id });
    //     userDb.firstName = user.firstName;
    //     userDb.middleName = user.middleName;
    //     userDb.lastName = user.lastName;
    //     userDb.email = user.email;
    //     userDb.role = user.Role;
    //     return await userDb.save();
    // }

    create = async (data: IVerification) => {
        var dataDb = new Verification(data);
        return await dataDb.save();
    }

    verify = async (user: string, code: string) => {
        let verifications = await Verification.find({ user: user });
        /* console.log(user);
        console.log(code); */

        let verification = verifications[0];


        // TODO: Check if the code is still pending to ACTIVATE.


        const userDb: any = await User.findOne({ _id: user });

        // TODO: Check if the user is not active yet.

        verification.statusVerification = StatusVerification.USED;
        await verification.save();

        userDb.isEmailVerified = true;
        await userDb.save();

        // Sort by date received, check each one and check if the code is the one you send.

        // verifications.sort(function(a,b){
        //     return b.fecha - a.fecha;
        //   });

        // verifications.forEach(verification => {

        // });

        // let verification = verifications[0];
        // console.log(verification);
        // if (verification.code === code) {
        //     console.log('entra');
        //     verification.StatusVerification = StatusVerification.USED;
        //     verification.fechaUso = new Date();
        //     return await verification.save();
        // }

        return verification;

        // return await dataDb.save();
    }

    // delete = async (id: string) => {
    //     return await User.deleteOne({ _id: id });
    // }
}
