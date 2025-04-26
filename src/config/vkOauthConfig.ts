import { registerAs } from '@nestjs/config';

export const vkOauthConfig = registerAs('oauth', () => ({
  vk: {
    clientId: process.env.VK_CLIENT_ID,
    clientSecret: process.env.VK_CLIENT_SECRET,
    redirectUri: process.env.VK_REDIRECT_URI,
    authUrl: 'https://oauth.vk.com/authorize',
    tokenUrl: 'https://oauth.vk.com/access_token',
    apiUrl: 'https://api.vk.com/method',
    apiVersion: '5.131',
  },
}));
