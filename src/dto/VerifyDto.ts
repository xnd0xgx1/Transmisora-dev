import { IsString } from 'class-validator';

class VerifyDto {

    @IsString()
    public value: string;

    @IsString()
    public code: string;
}

export default VerifyDto;
