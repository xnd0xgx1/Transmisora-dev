const _importDynamic = new Function("modulePath", "return import(modulePath)");

async function fetch(...args) {
    const { default: fetch } = await _importDynamic("node-fetch");
    return fetch(...args);
}

class VeriDocProvider {

    private accesToken = '';

    constructor() {

    }

    login = async () => {
        try {
            let data = {
                "grant_type": process.env.GRANT_TYPE_VERIDOC,
                "client_id": process.env.CLIENT_ID_VERIDOC,
                "client_secret": process.env.CLIENT_SECRET_VERIDOC,
                "audience": process.env.AUDIENCE_VERIDOC,
            }
            await fetch(`https://veridocid.azure-api.net/api/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(response => {
                    this.accesToken = response.access_token
                })
                .catch(err => console.error(err));
        } catch (e) {
            console.log(e);
        }
    }

    requestIdentityDocumentVerification = async (id: any, frontImage: string, backImage: string) => {
        try {
            await this.login();

            let data: any = {
                "id": id,
                "frontImage": frontImage                
            }

            if (backImage !== '') {
                data = {
                    "id": id,
                    "frontImage": frontImage,
                    "backImage": backImage
                }
            }

            return await fetch(`https://veridocid.azure-api.net/api/id/v2/verify`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${this.accesToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            })
                .then(response => response.text())
                .catch(err => console.error(err));
        } catch (e) {
            console.log(e);
        }
    }

    requestIdentityDocumentVerificationStatus = async (uuid: string) => {
        try {
            await this.login();
            let data = { "uuid": uuid }

            return await fetch(`https://veridocid.azure-api.net/api/id/v2/status`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${this.accesToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            })
                .then(response => response.text())
                .catch(err => console.error(err));
        } catch (e) {
            console.log(e);
        }
    }

    requestIdentityDocumentVerificationGetResults = async (uuid: string) => {
        try {
            await this.login();
            let data = { "uuid": uuid }

            return await fetch(`https://veridocid.azure-api.net/api/id/v2/results`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${this.accesToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .catch(err => console.error(err));
        } catch (e) {
            console.log(e);
        }
    }
}

export default VeriDocProvider;
