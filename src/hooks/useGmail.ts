import { useAuth } from './useAuth';

export function useGmail() {
  const { accessToken } = useAuth();

  const sendEmail = async (to: string, subject: string, message: string) => {
    if (!accessToken) throw new Error('No access token available');

    // Create a raw MIME message
    const emailStr = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      message
    ].join('\n');

    // the Gmail API expects "base64url" encoded string
    const encodedMessage = btoa(unescape(encodeURIComponent(emailStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to send email: ${err}`);
    }

    return await res.json();
  };

  return { sendEmail };
}
