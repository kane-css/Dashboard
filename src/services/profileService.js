import { supabase } from "../supabase";

// ✅ Upload image to storage
export async function uploadProfileImage(file, userId) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `profile-pics/${fileName}`;

  // upload to bucket "avatars" (create it in Supabase dashboard)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // get public URL
  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
}

// ✅ Update profile info
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select();

  if (error) throw error;
  return data;
}
