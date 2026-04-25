import AppSettings from '../models/AppSettings.js';

export const defaultSocialLinks = [
  {
    platform: 'whatsapp-group',
    name: 'WhatsApp Group',
    url: 'https://chat.whatsapp.com/GhNPmGwxRoKLct8r9OUN07'
  },
  {
    platform: 'whatsapp-channel',
    name: 'WhatsApp Channel',
    url: 'https://whatsapp.com/channel/0029Vb7wkHe9hXEzePifXq43'
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/afaqllc1?igsh=dHp5aGJ2M2ZuMXV2'
  },
  {
    platform: 'x',
    name: 'X / Twitter',
    url: 'https://x.com/mr_afaq295'
  },
  {
    platform: 'telegram',
    name: 'Telegram',
    url: 'https://t.me/Mrafaqllcc'
  }
];

export async function getAppSettings() {
  let settings = await AppSettings.findOne({ key: 'app' });
  if (!settings) {
    settings = await AppSettings.create({
      key: 'app',
      socialLinks: defaultSocialLinks
    });
  } else if (!settings.socialLinks?.length) {
    settings.socialLinks = defaultSocialLinks;
    await settings.save();
  }
  return settings;
}
