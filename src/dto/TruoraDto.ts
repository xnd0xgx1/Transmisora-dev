import { IsString } from 'class-validator';

class TruoraDto {

    @IsString()
    public token: string;
}

export default TruoraDto;
