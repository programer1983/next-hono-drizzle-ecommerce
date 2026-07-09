import ImageKit from "@imagekit/nodejs";

export type HonoEnv = {
  Bindings: {
    IMAGEKIT_PRIVATE_KEY: string;
    IMAGEKIT_PUBLIC_KEY: string;
    IMAGEKIT_URL_ENDPOINT: string;
  };
};

export async function deleteImageKitAsset(
  env: HonoEnv["Bindings"],
  storedFileId: string | null | undefined,
) {
  if (!storedFileId) return;

  const client = new ImageKit({
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
  });

  try {
    await client.files.delete(storedFileId);
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.message?.includes("not found")) {
      return;
    }
    throw error;
  }
}
