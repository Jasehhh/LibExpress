import { env } from "~/env";
import { auth } from "~/server/auth";
import { getFileUrl, uploadToRelay } from "~/server/lib/relay";

// Uploads a book cover to the Relay file service. Send the image as the
// "file" form field; answers { url } to save on the book.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!env.RELAY_URL) {
    return Response.json(
      { error: "RELAY_URL is not configured." },
      { status: 500 },
    );
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
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
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
