const i18n = require('../i18n.config');

function i18NMiddleware<T>(): any {
    return (req, res, next) => {
        let language = req.headers["accept-language"];
        switch (language) {
            case 'es':
                i18n.setLocale('es');
                break;
            case 'en':
                i18n.setLocale('en');
                break;
            default:
                i18n.setLocale('es');
                break;
        }
        next();
    };
}

export default i18NMiddleware;
