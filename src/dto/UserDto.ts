import { IsString, IsOptional, IsBoolean, IsDate, IsNumber, IsArray, ValidateNested, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

class UserDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    createdAt?: Date;

    @IsArray()
    @IsString({ each: true })
    roles: string[];

    @IsOptional()
    @IsNumber()
    failedLoginAttempts?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean;

    @IsOptional()
    @IsBoolean()
    isComplete?: boolean;

    @IsOptional()
    @IsBoolean()
    isAdminVerified?: boolean;

    @IsOptional()
    @IsBoolean()
    isCellPhonVerified?: boolean;

    @IsOptional()
    @IsBoolean()
    isEmailVerified?: boolean;

    @IsOptional()
    @IsBoolean()
    isDeleted?: boolean;

    @IsOptional()
    @IsString()
    RegistrationStage?: string;

    @IsOptional()
    @IsMongoId()
    language?: string;

    @IsOptional()
    @IsString()
    nationality?: string;

    @IsOptional()
    @IsString()
    domicileAt?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phoneCode?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    phoneExtra?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    mothersLastName?: string;

    @IsOptional()
    @IsString()
    emailSecondary?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    birthdate?: Date;

    @IsOptional()
    @IsString()
    countryOfBirth?: string;

    @IsOptional()
    @IsString()
    federalEntityOfBirth?: string;

    @IsOptional()
    @IsMongoId()
    occupation?: string;

    @IsOptional()
    @IsString()
    curp?: string;

    @IsArray()
    @IsMongoId({ each: true })
    address?: string[];

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    userName?: string;

    @IsOptional()
    @IsMongoId()
    ineFront?: string;

    @IsOptional()
    @IsMongoId()
    ineBack?: string;

    @IsOptional()
    @IsMongoId()
    passportFront?: string;

    @IsOptional()
    @IsMongoId()
    passportBack?: string;

    @IsOptional()
    @IsString()
    identificationType?: string;

    @IsOptional()
    @IsString()
    identificationNumber?: string;

    @IsOptional()
    @IsMongoId()
    signature?: string;

    @IsOptional()
    @IsNumber()
    pinCode?: number;

    @IsOptional()
    @IsString()
    businessName?: string;

    @IsOptional()
    @IsString()
    businessLine?: string;

    @IsOptional()
    @IsString()
    rfc?: string;

    @IsOptional()
    @IsString()
    businessId?: string;

    @IsOptional()
    @IsString()
    countryOfAssignment?: string;

    @IsOptional()
    @IsString()
    electronicSignatureSeries?: string;

    @IsArray()
    @IsMongoId({ each: true })
    businessAddress?: string[];

    @IsArray()
    @IsMongoId({ each: true })
    administrators?: string[];

    @IsArray()
    @IsMongoId({ each: true })
    files?: string[];

    @IsOptional()
    @IsString()
    emailExtra?: string;

    @IsOptional()
    @IsString()
    fiel?: string;

    @IsOptional()
    @IsString()
    clabe?: string;

    @IsOptional()
    @IsNumber()
    balance?: number;

    @IsOptional()
    @IsNumber()
    balanceUSD?: number;

    @IsArray()
    @IsMongoId({ each: true })
    devices?: string[];

    @IsOptional()
    @IsString()
    pomeloUserId?: string;

    @IsOptional()
    @IsString()
    pomeloClientId?: string;

    @IsArray()
    @IsMongoId({ each: true })
    cards?: string[];
}

export default UserDto;

