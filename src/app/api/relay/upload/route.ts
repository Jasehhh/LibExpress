import { env } from "~/env";
import { auth } from "~/server/auth";
import { getFileUrl, uploadToRelay } from "~/server/lib/relay";

// Under Vercel's 4.5 MB request body limit, so the error is ours, not theirs.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json(
      { error: "Only image files can be uploaded." },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: "Images must be 4 MB or smaller." },
      { status: 400 },
    );
  }

  if (!env.RELAY_URL) {
    return Response.json(
      { error: "RELAY_URL is not configured." },
      { status: 500 },
    );
  }

  try {
    const result = await uploadToRelay(file);
    if (!result.success || !result.data) {
      return Response.json(
        { error: result.error ?? "Upload failed" },
        { status: 502 },
      );
    }

    const url = await getFileUrl(result.data.id);
    if (!url) {
      return Response.json(
        { error: "Upload succeeded but no url was returned" },
        { status: 502 },
      );
    }

    return Response.json({ url }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Couldn't reach the image server. Try again." },
      { status: 502 },
    );
  }
}
