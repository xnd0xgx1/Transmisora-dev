import { IsBoolean, IsString } from 'class-validator';

class VerificationDeviceDto {

    @IsString()
    public deviceToken: string;

    @IsString()
    public info: string;

    @IsBoolean()
    public sendVerificationCodeToPrimary: boolean;
}

export default VerificationDeviceDto;
