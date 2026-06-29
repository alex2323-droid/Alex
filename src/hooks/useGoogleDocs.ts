import { useAuth } from './useAuth';

export function useGoogleDocs() {
  const { accessToken } = useAuth();

  const createAndWriteDocument = async (title: string, textContent: string) => {
    if (!accessToken) throw new Error('No access token available');

    // 1. Create a new document
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create document: ${err}`);
    }

    const doc = await createRes.json();
    const documentId = doc.documentId;

    // 2. Insert text into the document
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: textContent,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Failed to write to document: ${err}`);
    }

    return documentId;
  };

  return { createAndWriteDocument };
}
