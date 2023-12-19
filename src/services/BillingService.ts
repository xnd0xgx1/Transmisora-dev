import BaseService from "./base/BaseService";
import BillingRepository from "../repositories/BillingRepository";
import Bill from "../models/Bill";
import fetch, { Headers } from "node-fetch";
// const fetch = require('node-fetch');
// const { Headers } = fetch;

class BillingService extends BaseService<BillingRepository> {

    private token = 'T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbXB3YVZxTHdOdHAwVXY2NTdJb1hkREtXTzE3dk9pMmdMdkFDR2xFWFVPUXpTUm9mTG1ySXdZbFNja3FRa0RlYURqbzdzdlI2UUx1WGJiKzViUWY2dnZGbFloUDJ6RjhFTGF4M1BySnJ4cHF0YjUvbmRyWWpjTkVLN3ppd3RxL0dJPQ.T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbFlVcU92YUJTZWlHU3pER1kySnlXRTF4alNUS0ZWcUlVS0NhelhqaXdnWTRncklVSWVvZlFZMWNyUjVxYUFxMWFxcStUL1IzdGpHRTJqdS9Zakw2UGQrNzJ3UWh4TVVxb0g3TU5KV0Q2Um5rb2VpQlZibFk2b3JLeURxQmU5TGhudldsdjExeGpvaDBEQVZYWUhWTE5nKzh5MENnVm9MRjNwRE5MU0xuOWtRdTNGMktEajgrSlVtcVNPbWpLSE9hajJCZC9zOFBEOVp3VG9BbFRaMkFsSHl4ZkoxSWlQYnRERi9kTCtaMkhWeHROSmlUemxHbEhHbDBIMEdueTh0ZmtSOHUwMVNaempVNnlDNTRLRzhxNmU5VlpIdlhJVDMyZ2V2aDVvQzNjRW1YUFVJeXdHcmdvUmhBdVhCS0xyYi9hYjc5Mm40RE1GRUc1MGRkcTg2S0dGSUhVMkhKek5GUTZWRTZpWmlrWG5uZnFLUis1RUZCVmlONjM5YXlXRWRuQjdOK1dTMExnQ2pyWTRwTmdUeW1lRkFLL3UwUFh1Rk9xcytPMlZaN2dLUjNCNEo5aWpGZWFPUnJBQmh2QVhrZVpNa0g2TFZialZvOURwbEdocmgvVXA.SG1wPsd0gqgJFXQXZivd_o86L1E0ERiWpTlaE-yvkgQ';

    constructor() {
        super(new BillingRepository(Bill));
    }

    createBill = async () => {
        try {

            const res = await this.fetch('10.00', 'EKU9003173C9', 'ESCUELA KEMPER URGATE');
            console.log(res);
        }
        catch (e) {
            throw (e);
        }
    }

    getPdf = async () => {
        try {

            const data = {
                "xmlContent": "<?xml version=\"1.0\" encoding=\"utf-8\"?><cfdi:Comprobante xsi:schemaLocation=\"http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd\" Version=\"4.0\" Serie=\"SW\" Folio=\"123456\" Fecha=\"2023-04-13T00:00:00\" Sello=\"SS8/ojAAvA0mx0KQ1/vWi+SaQAHhRYh+zWjm/KlzmzzPQqliotwp96U/Yhpcz7PvEyZB/VOUu7UjU1uWX+QEm3Sboi+mUkLRY1sg46hqIJ4I+uNj8xtrkDyG6QUV6qaNtrY9idiIYxhpNDk4Yd7OzXyNyQQfyx37OzdnI8ST6JTZ+sXFDPOsrjLQx37La8hNml6SerOgdgoRCGzGZoiUdJfZrqPde7ckToxrA62jx2o0uA3e8hWPeaJx1HL8Ao1l7FglNX+Tl3Y3OIJzpvLLZJDxKvhGIsFS5d9wGZ9iJfCBs3pffDxWzUNhzhv9xIozNwdVLNc7ddZLGroMKG1nPQ==\" FormaPago=\"01\" NoCertificado=\"30001000000400002434\" Certificado=\"MIIFuzCCA6OgAwIBAgIUMzAwMDEwMDAwMDA0MDAwMDI0MzQwDQYJKoZIhvcNAQELBQAwggErMQ8wDQYDVQQDDAZBQyBVQVQxLjAsBgNVBAoMJVNFUlZJQ0lPIERFIEFETUlOSVNUUkFDSU9OIFRSSUJVVEFSSUExGjAYBgNVBAsMEVNBVC1JRVMgQXV0aG9yaXR5MSgwJgYJKoZIhvcNAQkBFhlvc2Nhci5tYXJ0aW5lekBzYXQuZ29iLm14MR0wGwYDVQQJDBQzcmEgY2VycmFkYSBkZSBjYWRpejEOMAwGA1UEEQwFMDYzNzAxCzAJBgNVBAYTAk1YMRkwFwYDVQQIDBBDSVVEQUQgREUgTUVYSUNPMREwDwYDVQQHDAhDT1lPQUNBTjERMA8GA1UELRMIMi41LjQuNDUxJTAjBgkqhkiG9w0BCQITFnJlc3BvbnNhYmxlOiBBQ0RNQS1TQVQwHhcNMTkwNjE3MTk0NDE0WhcNMjMwNjE3MTk0NDE0WjCB4jEnMCUGA1UEAxMeRVNDVUVMQSBLRU1QRVIgVVJHQVRFIFNBIERFIENWMScwJQYDVQQpEx5FU0NVRUxBIEtFTVBFUiBVUkdBVEUgU0EgREUgQ1YxJzAlBgNVBAoTHkVTQ1VFTEEgS0VNUEVSIFVSR0FURSBTQSBERSBDVjElMCMGA1UELRMcRUtVOTAwMzE3M0M5IC8gWElRQjg5MTExNlFFNDEeMBwGA1UEBRMVIC8gWElRQjg5MTExNk1HUk1aUjA1MR4wHAYDVQQLExVFc2N1ZWxhIEtlbXBlciBVcmdhdGUwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCN0peKpgfOL75iYRv1fqq+oVYsLPVUR/GibYmGKc9InHFy5lYF6OTYjnIIvmkOdRobbGlCUxORX/tLsl8Ya9gm6Yo7hHnODRBIDup3GISFzB/96R9K/MzYQOcscMIoBDARaycnLvy7FlMvO7/rlVnsSARxZRO8Kz8Zkksj2zpeYpjZIya/369+oGqQk1cTRkHo59JvJ4Tfbk/3iIyf4H/Ini9nBe9cYWo0MnKob7DDt/vsdi5tA8mMtA953LapNyCZIDCRQQlUGNgDqY9/8F5mUvVgkcczsIgGdvf9vMQPSf3jjCiKj7j6ucxl1+FwJWmbvgNmiaUR/0q4m2rm78lFAgMBAAGjHTAbMAwGA1UdEwEB/wQCMAAwCwYDVR0PBAQDAgbAMA0GCSqGSIb3DQEBCwUAA4ICAQBcpj1TjT4jiinIujIdAlFzE6kRwYJCnDG08zSp4kSnShjxADGEXH2chehKMV0FY7c4njA5eDGdA/G2OCTPvF5rpeCZP5Dw504RZkYDl2suRz+wa1sNBVpbnBJEK0fQcN3IftBwsgNFdFhUtCyw3lus1SSJbPxjLHS6FcZZ51YSeIfcNXOAuTqdimusaXq15GrSrCOkM6n2jfj2sMJYM2HXaXJ6rGTEgYmhYdwxWtil6RfZB+fGQ/H9I9WLnl4KTZUS6C9+NLHh4FPDhSk19fpS2S/56aqgFoGAkXAYt9Fy5ECaPcULIfJ1DEbsXKyRdCv3JY89+0MNkOdaDnsemS2o5Gl08zI4iYtt3L40gAZ60NPh31kVLnYNsmvfNxYyKp+AeJtDHyW9w7ftM0Hoi+BuRmcAQSKFV3pk8j51la+jrRBrAUv8blbRcQ5BiZUwJzHFEKIwTsRGoRyEx96sNnB03n6GTwjIGz92SmLdNl95r9rkvp+2m4S6q1lPuXaFg7DGBrXWC8iyqeWE2iobdwIIuXPTMVqQb12m1dAkJVRO5NdHnP/MpqOvOgLqoZBNHGyBg4Gqm4sCJHCxA1c8Elfa2RQTCk0tAzllL4vOnI1GHkGJn65xokGsaU4B4D36xh7eWrfj4/pgWHmtoDAYa8wzSwo2GVCZOs+mtEgOQB91/g==\" CondicionesDePago=\"CondicionesDePago\" SubTotal=\"10.00\" Descuento=\"0.00\" Moneda=\"AMD\" TipoCambio=\"1\" Total=\"10.00\" TipoDeComprobante=\"I\" Exportacion=\"01\" MetodoPago=\"PUE\" LugarExpedicion=\"45610\" xmlns:cfdi=\"http://www.sat.gob.mx/cfd/4\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><cfdi:Emisor Rfc=\"EKU9003173C9\" Nombre=\"ESCUELA KEMPER URGATE\" RegimenFiscal=\"603\" /><cfdi:Receptor Rfc=\"EKU9003173C9\" Nombre=\"ESCUELA KEMPER URGATE\" DomicilioFiscalReceptor=\"26015\" RegimenFiscalReceptor=\"601\" UsoCFDI=\"CP01\" /><cfdi:Conceptos><cfdi:Concepto ClaveProdServ=\"50211503\" NoIdentificacion=\"None\" Cantidad=\"1.0\" ClaveUnidad=\"H87\" Unidad=\"Pieza\" Descripcion=\"Cigarros\" ValorUnitario=\"10.00\" Importe=\"10.00\" Descuento=\"0.00\" ObjetoImp=\"02\"><cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base=\"1\" Impuesto=\"002\" TipoFactor=\"Tasa\" TasaOCuota=\"0.160000\" Importe=\"1\" /></cfdi:Traslados><cfdi:Retenciones><cfdi:Retencion Base=\"1\" Impuesto=\"002\" TipoFactor=\"Tasa\" TasaOCuota=\"0.040000\" Importe=\"1\" /></cfdi:Retenciones></cfdi:Impuestos></cfdi:Concepto></cfdi:Conceptos><cfdi:Impuestos TotalImpuestosRetenidos=\"1.00\" TotalImpuestosTrasladados=\"1.00\"><cfdi:Retenciones><cfdi:Retencion Impuesto=\"002\" Importe=\"1.00\" /></cfdi:Retenciones><cfdi:Traslados><cfdi:Traslado Base=\"1.00\" Impuesto=\"002\" TipoFactor=\"Tasa\" TasaOCuota=\"0.160000\" Importe=\"1.00\" /></cfdi:Traslados></cfdi:Impuestos><cfdi:Complemento><tfd:TimbreFiscalDigital xsi:schemaLocation=\"http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd\" Version=\"1.1\" UUID=\"f5282cdc-3ccf-4563-876e-a2d93909eac5\" FechaTimbrado=\"2023-04-13T11:36:01\" RfcProvCertif=\"SPR190613I52\" SelloCFD=\"SS8/ojAAvA0mx0KQ1/vWi+SaQAHhRYh+zWjm/KlzmzzPQqliotwp96U/Yhpcz7PvEyZB/VOUu7UjU1uWX+QEm3Sboi+mUkLRY1sg46hqIJ4I+uNj8xtrkDyG6QUV6qaNtrY9idiIYxhpNDk4Yd7OzXyNyQQfyx37OzdnI8ST6JTZ+sXFDPOsrjLQx37La8hNml6SerOgdgoRCGzGZoiUdJfZrqPde7ckToxrA62jx2o0uA3e8hWPeaJx1HL8Ao1l7FglNX+Tl3Y3OIJzpvLLZJDxKvhGIsFS5d9wGZ9iJfCBs3pffDxWzUNhzhv9xIozNwdVLNc7ddZLGroMKG1nPQ==\" NoCertificadoSAT=\"30001000000400002495\" SelloSAT=\"JpMY8RBeJlS9/kyNB/adUldjChX2fHtMBipsikMznMRwEMiRSwh00++W/C3jZeZPri+Fm+Dhadq9yrwtT2L58CvgLi0fw02g/sXTsBNuLxF2JlcGX+8uGei7ibRmOHoMcRQPmX0H0LK4PDqjsCPZHditLTTgFcVwMWGaIMNff/9ylHr+VZIHbRJiv1Om618viWN25OOULUyqBaFG/aJjv9dgd09oNUe22lD6I8Sw0xIaftTWqqsymK2zKaTcfIgiz3mUXxlm3QQ3Ke0DzMu0hrH98szxAkvLlQ1iepWPRDjjzggKqQDuUYaZc3dofDbUDH2WLCjTLE7p9//tBPM3LA==\" xmlns:tfd=\"http://www.sat.gob.mx/TimbreFiscalDigital\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" /></cfdi:Complemento></cfdi:Comprobante>",
                "logo": "",
                "extras": {
                    "OBSERVACIONES": "Observaciones ejemplo",
                    "CalleCliente": "#111",
                    "NumeroExteriorCliente": "CUSTOM ADDRESS"
                },
                "templateId": "cfdi40"
            }

            const url = `https://api.test.sw.com.mx/pdf/v1/api/GeneratePdf`;

            let headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token
            })

            let response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (response.status === 401) {
                const res = await response.json();
                console.log(res);
            } else if (response.status === 404) {
                console.log('res');
            } else if (response.status !== 200) {
                const res = await response.json();
                console.log(res);
            }
            else {
                return await response.json();
            }
        }
        catch (e) {
            throw (e);
        }
    }

    fetch = async (subTotal: string, rfc: string, nombre: string) => {
        try {

            const EMISOR_RFC = 'EKU9003173C9';
            const EMISOR_NOMBRE = 'ESCUELA KEMPER URGATE';
            const EMISOR_REGIMEN_FISCAL = '603';

            const token = 'T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbXB3YVZxTHdOdHAwVXY2NTdJb1hkREtXTzE3dk9pMmdMdkFDR2xFWFVPUXpTUm9mTG1ySXdZbFNja3FRa0RlYURqbzdzdlI2UUx1WGJiKzViUWY2dnZGbFloUDJ6RjhFTGF4M1BySnJ4cHF0YjUvbmRyWWpjTkVLN3ppd3RxL0dJPQ.T2lYQ0t4L0RHVkR4dHZ5Nkk1VHNEakZ3Y0J4Nk9GODZuRyt4cE1wVm5tbFlVcU92YUJTZWlHU3pER1kySnlXRTF4alNUS0ZWcUlVS0NhelhqaXdnWTRncklVSWVvZlFZMWNyUjVxYUFxMWFxcStUL1IzdGpHRTJqdS9Zakw2UGQrNzJ3UWh4TVVxb0g3TU5KV0Q2Um5rb2VpQlZibFk2b3JLeURxQmU5TGhudldsdjExeGpvaDBEQVZYWUhWTE5nKzh5MENnVm9MRjNwRE5MU0xuOWtRdTNGMktEajgrSlVtcVNPbWpLSE9hajJCZC9zOFBEOVp3VG9BbFRaMkFsSHl4ZkoxSWlQYnRERi9kTCtaMkhWeHROSmlUemxHbEhHbDBIMEdueTh0ZmtSOHUwMVNaempVNnlDNTRLRzhxNmU5VlpIdlhJVDMyZ2V2aDVvQzNjRW1YUFVJeXdHcmdvUmhBdVhCS0xyYi9hYjc5Mm40RE1GRUc1MGRkcTg2S0dGSUhVMkhKek5GUTZWRTZpWmlrWG5uZnFLUis1RUZCVmlONjM5YXlXRWRuQjdOK1dTMExnQ2pyWTRwTmdUeW1lRkFLL3UwUFh1Rk9xcytPMlZaN2dLUjNCNEo5aWpGZWFPUnJBQmh2QVhrZVpNa0g2TFZialZvOURwbEdocmgvVXA.SG1wPsd0gqgJFXQXZivd_o86L1E0ERiWpTlaE-yvkgQ';

            const data = {
                "Version": "4.0",
                "FormaPago": "01",
                "Serie": "SW",
                "Folio": "1234568976",
                "Fecha": "2023-03-27T00:00:00",
                "MetodoPago": "PUE",
                "Sello": "",
                "NoCertificado": "",
                "Certificado": "",
                "CondicionesDePago": "CondicionesDePago",
                "SubTotal": subTotal,
                "Descuento": "0.00",
                "Moneda": "AMD",
                "TipoCambio": "1",
                "Total": subTotal,
                "TipoDeComprobante": "I",
                "Exportacion": "01",
                "LugarExpedicion": "45610", // De donde sale?
                "Emisor": {
                    "Rfc": EMISOR_RFC,
                    "Nombre": EMISOR_NOMBRE,
                    "RegimenFiscal": EMISOR_REGIMEN_FISCAL
                },
                "Receptor": {
                    "Rfc": rfc,
                    "Nombre": nombre,
                    "DomicilioFiscalReceptor": "26015", // Donde se registra?
                    "RegimenFiscalReceptor": "601", // De donde sale?
                    "UsoCFDI": "CP01" // De donde sale?
                },
                "Conceptos": [
                    {
                        "ClaveProdServ": "50211503",
                        "NoIdentificacion": "None",
                        "Cantidad": "1.0",
                        "ClaveUnidad": "H87", // Donde se registra?
                        "Unidad": "Pieza", // Donde se registra?
                        "Descripcion": "Cigarros",
                        "ValorUnitario": subTotal,
                        "Importe": subTotal,
                        "Descuento": "0.00",
                        "ObjetoImp": "02",
                        "Impuestos": {
                            "Traslados": [
                                {
                                    "Base": "1",
                                    "Importe": "1",
                                    "Impuesto": "002",
                                    "TasaOCuota": "0.160000",
                                    "TipoFactor": "Tasa"
                                }
                            ],
                            "Retenciones": [
                                {
                                    "Base": "1",
                                    "Importe": "1",
                                    "Impuesto": "002",
                                    "TasaOCuota": "0.040000",
                                    "TipoFactor": "Tasa"
                                }
                            ]
                        }
                    }
                ],
                "Impuestos": {
                    "TotalImpuestosTrasladados": "1.00",
                    "TotalImpuestosRetenidos": "1.00",
                    "Retenciones": [
                        {
                            "Importe": "1.00",
                            "Impuesto": "002"
                        }
                    ],
                    "Traslados": [
                        {
                            "Base": "1.00",
                            "Importe": "1.00",
                            "Impuesto": "002",
                            "TasaOCuota": "0.160000",
                            "TipoFactor": "Tasa"
                        }
                    ]
                }
            }

            const url = `https://services.test.sw.com.mx` + `/v3/cfdi33/issue/json/v4`;

            // const data = JSON.parse(localStorage.getItem('DATA') || '{}');
            let headers = new Headers({
                'Content-Type': 'application/jsontoxml',
                'Authorization': 'Bearer ' + token
            })

            let response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            if (response.status === 401) {
                const res = await response.json();
                console.log(res);
            } else if (response.status === 404) {
                console.log('res');
            } else if (response.status !== 200) {
                const res = await response.json();
                console.log(res);
            }
            else {
                return await response.json();
            }
        }
        catch (e) {
            throw (e);
        }
    }
}

export default BillingService;
