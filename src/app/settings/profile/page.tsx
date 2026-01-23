"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { CreatorProfile } from "@/lib/types";
import Avatar from "@/components/Avatar";
import { Loader2 } from "lucide-react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("id", sessionData.session.user.id)
        .single();

      if (profileData) {
        const p = profileData as CreatorProfile;
        setProfile(p);
        setDisplayName(p.display_name || "");
        setBio(p.bio || "");
        setIsPublic(p.is_public);
        setAvatarUrl(p.avatar_url);
        setCoverImageUrl(p.cover_image_url);
      } else {
        router.push("/settings");
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingCover(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "covers");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();
      setCoverImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setSuccess(false);
    setSaving(true);

    const { error: updateError } = await supabase
      .from("creator_profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        is_public: isPublic,
        avatar_url: avatarUrl,
        cover_image_url: coverImageUrl,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="text-sm text-foreground/50">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/settings"
            className="rounded-xl p-2 hover:bg-cream-dark transition-colors"
          >
            <svg
              className="w-5 h-5 text-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-sm text-foreground/60">
              Update your public profile information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
            <div
              className="relative h-32 bg-cream-dark cursor-pointer group"
              onClick={() => !uploadingCover && coverInputRef.current?.click()}
            >
              {coverImageUrl ? (
                <Image
                  src={coverImageUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                {uploadingCover ? (
                  <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                  </div>
                ) : (
                  <div className="bg-card/90 backdrop-blur rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm text-foreground">
                      {coverImageUrl ? "Change cover" : "Add cover image"}
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            {/* Avatar & Username */}
            <div className="px-5 pb-5 -mt-8 relative">
              <div
                className="inline-block cursor-pointer group"
                onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
              >
                <div className="relative">
                  <Avatar
                    src={avatarUrl}
                    name={displayName || profile?.username}
                    size="xl"
                    className="border-4 border-card"
                  />
                  <div className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <svg
                        className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="mt-3">
                <div className="text-sm text-foreground/60">
                  @{profile?.username}
                </div>
                {profile?.username && (
                  <div className="mt-1 text-xs text-foreground/40">
                    thegiddyguide.com/{profile.username}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
                className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-foreground/40 resize-none"
                maxLength={500}
              />
              <div className="mt-1 text-xs text-foreground/50 text-right">
                {bio.length}/500
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-cream-dark rounded-full peer peer-checked:bg-red transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Public Profile
                  </div>
                  <div className="text-xs text-foreground/60">
                    Allow others to discover your profile and collections
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-xl bg-red-light border border-red/20 px-4 py-3 text-sm text-red">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Profile updated successfully!
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-red px-4 py-3 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
