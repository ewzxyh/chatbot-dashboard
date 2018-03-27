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
        BASE_URL: 'http://api.chat21.org/',
        // DEPARTMENTS_BASE_URL: 'http://api.chat21.org/app1/departments/', // URL BUILT directly IN DEPARTMENTS SERVICE
        // FAQKB_BASE_URL: 'http://api.chat21.org/app1/faq_kb/', // URL BUILT directly IN FAQ-KB SERVICE
        // FAQ_BASE_URL: 'http://api.chat21.org/app1/faq/', // URL BUILT directly IN FAQ SERVICE
        CONTACTS_BASE_URL: 'http://api.chat21.org/app1/contacts/',
        BOTS_BASE_URL: 'http://api.chat21.org/app1/bots/',
        // PROJECT_USER_BASE_URL: 'http://api.chat21.org/app1/project_users/', // NO MORE USED - THE RELATION PROJECT -> PROJECT USER IT'S DONE chat21-api-node.js
        PROJECTS_BASE_URL: 'http://api.chat21.org/projects/',
        SIGNUP_BASE_URL: 'http://api.chat21.org/auth/signup',
        SIGNIN_BASE_URL: 'http://api.chat21.org/auth/signin',
        MONGODB_PEOPLE_BASE_URL: 'http://api.chat21.org/app1/people/',
        FIREBASE_SIGNIN_BASE_URL: 'http://api.chat21.org/firebase/auth/signin',
        TOKEN: 'JWT [REDACTED_JWT]',
    },
    cloudFunctions: {
        cloud_functions_base_url: 'https://us-central1-chat-v2-dev.cloudfunctions.net/api/tilechat/groups/',
        // firebase_IdToken: 'Bearer [REDACTED_JWT]',
    },
};
