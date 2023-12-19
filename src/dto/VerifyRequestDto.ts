import { IsString } from 'class-validator';

class VerifyRequestDto {

    @IsString()
    public value: string;
}

export default VerifyRequestDto;
