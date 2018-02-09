// tslint:disable:max-line-length
export const environment = {
    production: true,
    firebaseConfig: {
        apiKey: '[REDACTED_GOOGLE_KEY]',
        authDomain: 'chat-v2-dev.firebaseapp.com',
        databaseURL: 'https://chat-v2-dev.firebaseio.com',
        projectId: 'chat-v2-dev',
        storageBucket: 'chat-v2-dev.appspot.com',
        messagingSenderId: '77360455507',
    },
    mongoDbConfig: {
        MONGODB_CONTACTS_BASE_URL: 'http://api.chat21.org/app1/contacts/',
        MONGODB_DEPARTMENTS_BASE_URL: 'http://api.chat21.org/app1/departments/',
        MONGODB_FAQ_BASE_URL: 'http://api.chat21.org/app1/faq/',
        MONGODB_BOTS_BASE_URL: 'http://api.chat21.org/app1/bots/',
        MONGODB_FAQKB_BASE_URL: 'http://api.chat21.org/app1/faq_kb/',
        TOKEN: 'JWT [REDACTED_JWT]',
    },
};
