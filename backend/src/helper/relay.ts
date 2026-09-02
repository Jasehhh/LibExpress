const RELAY_URL = process.env.RELAY_URL;

export const getFileUrl = async (
  fileId: string | null,
): Promise<string | null> => {
  if (!fileId) return null;

  const response = await fetch(`${RELAY_URL}/api/files/download/${fileId}`);
  const result = await response.json();

  if (!result.success) return null;
  return result.data.url;
};
