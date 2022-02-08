/* eslint-disable no-console */
/* eslint-disable consistent-return */

import fs from 'fs';
import { google } from 'googleapis';

import * as Credentials from '../../../config/credentials.json';
import * as Config from '../../../config/index.json';

export const getAuth = async () => {
  const {
    client_secret: clientSecret,
    client_id: clientId,
    redirect_uris: redirectUris,
  } = Credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUris[0],
  );
  let token: any;
  try {
    token = await fs.readFileSync(Config.services.google.pathToToken);
  } catch (err) {
    throw new Error('run getAccessToken.ts');
  }
  oAuth2Client.setCredentials(JSON.parse(token));
  const rtoken = await (await oAuth2Client.getAccessToken()).res?.data;
  if (!rtoken) return oAuth2Client;
  await fs.writeFileSync(
    Config.services.google.pathToToken,
    JSON.stringify(rtoken),
  );
  return oAuth2Client;
};
