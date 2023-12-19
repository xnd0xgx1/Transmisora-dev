import { IsObject, IsString } from 'class-validator';

class OtpDto {

    @IsObject()
    public user: string;

    @IsString()
    public otpType: string;

    @IsString()
    public code: string;
}

export default OtpDto;
