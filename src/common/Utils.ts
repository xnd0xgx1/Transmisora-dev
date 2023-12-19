export default class Utils {
    public generateInvitationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    public generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    public getSlug(text: any) {
        return text.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');
    }
}
