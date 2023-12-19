import VeriDocProvider from "../providers/VeriDocProvider";

class KycService {

    private veriDocProvider = new VeriDocProvider();    

    requestIdentityDocumentVerification = async (id:string, frontImage: string, backImage: string) => {
        return await this.veriDocProvider.requestIdentityDocumentVerification(id, frontImage, backImage);
    }

    requestIdentityDocumentVerificationStatus = async (uuid: string) => {
        return await this.veriDocProvider.requestIdentityDocumentVerificationStatus(uuid);
    }

    requestIdentityDocumentVerificationGetResults = async (uuid: string) => {
        return await this.veriDocProvider.requestIdentityDocumentVerificationGetResults(uuid);
    }
}

export default KycService;
