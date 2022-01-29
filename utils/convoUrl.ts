import * as Config from '../config/index.json';

const env = process.env.ENV || 'dev';

export default Config.applicationUrl[env];
