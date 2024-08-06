import { Schema, model } from 'mongoose';
import Double from '@mongoosejs/double';
import RegistrationStage from '../enums/RegistrationStage';
import IUser from '../interfaces/IUser';
import UserStatus from '../enums/UserStatus';

const schema = new Schema<IUser>({
    status: { type: String, default: UserStatus.PENDING },
    createdAt: { type: Date, default: Date.now },
    roles: [{ type: String, required: true }],
    failedLoginAttempts: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isComplete: { type: Boolean, default: false },
    isAdminVerified: { type: Boolean, default: false },
    isCellPhonVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    RegistrationStage: { type: String, default: RegistrationStage.INITIAL },

    language: { type: Schema.Types.ObjectId, ref: 'Catalog' },
    nationality: { type: String },
    domicileAt: { type: String },
    email: { type: String },
    phoneCode: { type: String },
    phone: { type: String },
    phoneExtra: { type: String },
    password: { type: String },

    firstName: { type: String },
    lastName: { type: String },
    mothersLastName: { type: String },
    emailSecondary: { type: String },
    gender: { type: String },
    birthdate: { type: Date },
    countryOfBirth: { type: String },
    federalEntityOfBirth: { type: String },
    occupation: { type: String},
    curp: { type: String },
    address: [{ type: Schema.Types.ObjectId, ref: 'Address' }],

    avatar: { type: String },
    color: { type: String },
    userName: { type: String },

    ineFront: { type: Schema.Types.ObjectId, ref: 'File' },
    ineBack: { type: Schema.Types.ObjectId, ref: 'File' },
    passportFront: { type: Schema.Types.ObjectId, ref: 'File' },
    passportBack: { type: Schema.Types.ObjectId, ref: 'File' },
    identificationType: { type: String },
    identificationNumber: { type: String },

    signature: { type: String },

    pinCode: { type: Number },

    // Persona moral.
    businessName: { type: String },
    businessLine: { type: String },
    rfc: { type: String },
    businessId: { type: String },
    countryOfAssignment: { type: String },
    electronicSignatureSeries: { type: String },
    businessAddress: [{ type: Schema.Types.ObjectId, ref: 'Address' }],

    administrators: [{ type: Schema.Types.ObjectId, ref: 'Administrator' }],

    files: [{ type: String }],

    emailExtra: { type: String },
    fiel: { type: String },
    clabe: { type: String },
    clabeactive: { type: Boolean,default:false},
    clabedepositos: { type: String },
    accountdepositos: { type: String },

    registerid: [{ type: Schema.Types.ObjectId, ref: 'registers' }],

    balance: { type: Double, default: 0 },
    balanceUSD: { type: Double, default: 0 },
    // deviceToken: { type: String },

    devices: [{ type: Schema.Types.ObjectId, ref: 'Device' }],

    pomeloUserId: { type: String },
    pomeloClientId: { type: String },
    cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
    accounts: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
    beneficiarios: { type: Schema.Types.Mixed, required: false },
    nivel: { type: Number, require: false },
    datosempresa:{ type: Schema.Types.Mixed, required: false },

}, { timestamps: true });

const User = model<IUser>('User', schema, 'users');
export default User;
