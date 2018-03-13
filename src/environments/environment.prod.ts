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
        MONGODB_PROJECTS_BASE_URL: 'http://api.chat21.org/app1/projects/',
        MONGODB_SIGNUP_BASE_URL: 'http://api.chat21.org/app1/auth/signup',
        MONGODB_PEOPLE_BASE_URL: 'http://api.chat21.org/app1/people/',
        SIGNIN_BASE_URL: 'http://api.chat21.org/app1/auth/signin',
        TOKEN: 'JWT [REDACTED_JWT]',
    },
    cloudFunctions: {
        cloud_functions_base_url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/',
        // firebase_IdToken: 'Bearer [REDACTED_JWT]',
    },
};
