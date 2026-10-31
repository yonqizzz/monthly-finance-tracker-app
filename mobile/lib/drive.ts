// import { GoogleSignin } from "@react-native-google-signin/google-signin";

let GoogleSignin: any = null;
try {
  GoogleSignin =
    require("@react-native-google-signin/google-signin").GoogleSignin;
} catch {}

const API = "https://www.googleapis.com";
const FILE_NAME = "finance-backup.json";

export function configureGoogle() {
  GoogleSignin?.configure({
    webClientId:
      "530998912801-t4pgkm5o5635v5imrgbj1hh7rltkj0d7.apps.googleusercontent.com",
    scopes: ["https://www.googleapis.com/auth/drive.appdata"],
  });
}

export async function signIn() {
  if (!GoogleSignin)
    throw new Error("Google Sign-in needs a development build.");
  await GoogleSignin.hasPlayServices();
  return GoogleSignin.signIn();
}

export async function signOut() {
  await GoogleSignin.signOut();
}

export function getCurrentUser() {
  return GoogleSignin?.getCurrentUser() ?? null; // null if not signed in
}

async function authHeader() {
  if (!GoogleSignin)
    throw new Error("Google Sign-in needs a development build.");
  const { accessToken } = await GoogleSignin.getTokens(); // library refreshes it
  return { Authorization: `Bearer ${accessToken}` };
}

async function findBackup() {
  const q = encodeURIComponent(`name='${FILE_NAME}'`);
  const res = await fetch(
    `${API}/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)`,
    { headers: await authHeader() },
  );
  if (!res.ok) throw new Error(`Drive error ${res.status}`);
  const json = await res.json();
  return (json.files?.[0] ?? null) as {
    id: string;
    modifiedTime: string;
  } | null;
}

export async function uploadBackup(content: string) {
  const existing = await findBackup();
  const boundary = "fin_boundary_7f3a";
  const metadata = existing
    ? {}
    : { name: FILE_NAME, parents: ["appDataFolder"] };

  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    `${content}\r\n--${boundary}--`;

  const url = existing
    ? `${API}/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : `${API}/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, {
    method: existing ? "PATCH" : "POST",
    headers: {
      ...(await authHeader()),
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export async function downloadBackup(): Promise<{
  data: any;
  modifiedTime: string;
} | null> {
  const existing = await findBackup();
  if (!existing) return null;
  const res = await fetch(`${API}/drive/v3/files/${existing.id}?alt=media`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return { data: await res.json(), modifiedTime: existing.modifiedTime };
}

export async function restoreSession() {
  try {
    await GoogleSignin?.signInSilently();
  } catch {}
  return GoogleSignin?.getCurrentUser() ?? null;
}
