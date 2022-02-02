import fs from 'fs';
import { google } from 'googleapis';

import * as Credentials from '../../../config/credentials.json';
import * as Config from '../../../config/index.json';

export const getAuth = async () => {
  const { client_secret, client_id, redirect_uris } = Credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );
  // check if token exists
  let token: any;
  try {
    token = await fs.readFileSync(Config.services.google.pathToToken);
  } catch (err) {
    throw new Error('run getAccessToken.ts');
  }
  oAuth2Client.setCredentials(JSON.parse(token));
  await oAuth2Client.refreshAccessToken((err, rtoken) => {
    console.log('storing refreshed token');
    fs.writeFile(
      Config.services.google.pathToToken,
      JSON.stringify(rtoken),
      (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', Config.services.google.pathToToken);
      },
    );
  });
  return oAuth2Client;
};
