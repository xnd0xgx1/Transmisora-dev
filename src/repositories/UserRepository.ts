import * as bcrypt from 'bcrypt';
import VerificationCode from "../models/VerificationCode";
import User from "../models/User";
import { BaseRepository } from './base/BaseRepository';
import Role from '../enums/Role';
import { ObjectId } from 'mongoose';


export default class UserRepository extends BaseRepository<typeof User> {
    

    getAllAdmins = async () => {
        return await User.find({ roles: { "$in": [Role.ADMIN, Role.DOCUMENT_VALIDATOR, Role.EXCHANGE_RATE] } }).sort({ createdAt: -1 });
    }

    getByUserName = async (userName: any) => {
        return await User.findOne({ userName: userName }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }

    getByEmail = async (email: any) => {
        return await User.findOne({ email: email }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }

    getByPhone = async (phoneCode: string, phone: string) => {
        return await User.findOne({ phoneCode: phoneCode, phone: phone }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }

    getByInviteCode = async (invitationCode: any) => {
        return await User.findOne({ invitationCode: invitationCode }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }

    passwordResetRequest = async (email: any) => {
        const userDb = await User.findOne({ email: email }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
        if (userDb !== undefined) {
            let verificationCode = new VerificationCode({
                code: '123456', // ALL: create a different code.
                user: userDb
            });
            verificationCode = await verificationCode.save();
            let data = verificationCode.toJSON();
            delete data.user;
            return data;
        }
        return '';
    }

    passwordReset = async (email: string, password: string, code: string) => {
        const userDb: any = await User.findOne({ email: email }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
        if (userDb !== undefined) {

            // ALL: Validate if the code is valid.

            userDb.password = await bcrypt.hash(password, 10);
            await userDb.save();
            return true;
        }
        return false;
    }

    // USERS APP-CMS
    getUsersForCMS = async () => {
       // return the users with status isDeleted = false, and populate with devices. sessionDate is obtained from the devices.
       return await User.find({ isDeleted: false }).sort({ createdAt: -1 }).populate('devices');
    }

    getUsersFilesForCMS = async () => {
        console.log("SEARCH");
        // return the users with status isDeleted = false, and populate with devices. sessionDate is obtained from the devices.
        return await User.find({ isDeleted: false,status:"UPLOAD_FILES_STARTED" }).sort({ createdAt: -1 }).populate('devices','files');
     }

    // CMS

    getById(id: any): Promise<typeof User> {
        return this.collection.findOne({ _id: id }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }

    getAll(): Promise<typeof User[]> {
        return this.collection.find().sort({ createdAt: -1 });
    }


    getallWClabe(): Promise<typeof User[]> {
        return this.collection.find({RegistrationStage : "FINISHED" }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }



    getbyCLABE(clabe:any): Promise<typeof User[]> {
        return this.collection.findOne({ clabe: clabe }).sort({ createdAt: -1 }).populate('picture administrators devices address businessAddress language cards accounts');
    }

    getAllValidateDocuments(): Promise<typeof User[]> {
        return this.collection.find({
            "files.0": {
                "$exists": true
            }
        }).sort({ createdAt: -1 }).populate('administrators');
    }

    
    getByemailandphone = async (userdata: any) => {
        return await this.collection.findOne({ phoneCode: userdata.phoneCode,phone:userdata.phone,email:userdata.email});
    }

    getbyregisterid = async (registerid: string) => {
        return await this.collection.findOne({
            registerid: [registerid],
          }).populate('picture administrators devices address businessAddress language cards accounts');;
    }



    updateByAccountId =  async (id: string, firstName:string,lastName:string,mothersLastName:string,status:number,password:string,email:string) => {

        console.log('Updating user:', id);
        let user = await this.collection.findOne({ _id: id }).sort({ createdAt: -1 });
        console.log('objectDb:', user);
        if (user !== null) {


            if(user.roles[0] == "PERSONA_MORAL"){
                user.set(`datosempresa.razonsocial`, firstName);
            }else{
                user["firstName"] = firstName;
                user["lastName"] = lastName;
                user["mothersLastName"] = mothersLastName;
            }

            user["email"] = email;

            switch(status){
                case 0:
                    user["isActive"] = true;
                    user["isBlocked"] = false;
                    break;
                case 1:
                    user["isActive"] = false;
                    user["isBlocked"] = false;
                    break;
                case 2:
                    user["isActive"] = false;
                    user["isBlocked"] = true;
                    break;
                default:
                    break;
            }
            if(password != null && password != ""){
                const hashedPassword = await bcrypt.hash(password, 10);
                user["password"] = hashedPassword;
            }
        



            // Añadir o actualizar campos en el documento
          
            await user.save(); // Intenta guardar los cambios en la base de datos
            console.log('Updated register:', user);
            return user;
        } else {
            // Manejo del caso en que el documento no se encuentra
            throw new Error('Document not found');
        }
    }
}
