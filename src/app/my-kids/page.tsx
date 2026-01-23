"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { WishlistItem, WishlistStatus, ScrapedProduct } from "@/lib/types";
import AddToCollectionModal from "@/components/AddToCollectionModal";
import Avatar from "@/components/Avatar";
import { Loader2, Camera } from "lucide-react";

type KidSizes = {
  // Clothing
  clothing_top: string | null;
  clothing_bottom: string | null;
  pajamas: string | null;
  // Shoes & Feet
  shoe_size: string | null;
  socks: string | null;
  // Underneath
  underwear_size: string | null;
  diaper_or_underwear: string | null;
  // Accessories
  hat_size: string | null;
  gloves_size: string | null;
  // Sports & Gear
  bike_size: string | null;
  helmet_size: string | null;
  baseball_glove: string | null;
  sports_gear_notes: string | null;
  // General
  notes: string | null;
};

type KidPreferences = {
  interests: string[];
  favorite_things: string[];
  dislikes: string[];
  allergies: string[];
  colors: string[];
  notes: string | null;
};

type Kid = {
  id: string;
  name: string;
  birthdate: string | null;
  avatar_url: string | null;
  kid_sizes: KidSizes | null;
  kid_preferences: KidPreferences | null;
};

const DIAPER_SIZES = ["NB", "1", "2", "3", "4", "5", "6", "7"];
const PULLUP_SIZES = ["2T-3T", "3T-4T", "4T-5T"];
const UNDERWEAR_SIZES = [
  "2T/3T", "4T/5T", "6/7", "8", "10", "12", "14",
  "Youth S", "Youth M", "Youth L",
  "Adult S", "Adult M", "Adult L", "Adult XL"
];
const BRA_SIZES = [
  "Training Bra",
  "28AA", "30AA", "32AA",
  "28A", "30A", "32A",
  "30B", "32B", "32C",
  "34A", "34B", "34C",
  "36A", "36B", "36C"
];
const SOCK_SIZES = ["0-6m", "6-12m", "12-24m", "2T-3T", "4T-5T", "6-8", "9-12", "13-17"];

// Clothing size options
const CLOTHING_SIZES = [
  "Preemie", "Newborn", "0-3M", "3-6M", "6-9M", "9-12M", "12M", "18M", "24M",
  "2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14", "16",
  "Youth XS", "Youth S", "Youth M", "Youth L", "Youth XL",
  "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL"
];

// Shoe size options grouped by category (with half sizes)
const SHOE_SIZES = [
  // Infant
  "Infant 0", "Infant 0.5", "Infant 1", "Infant 1.5", "Infant 2", "Infant 2.5", "Infant 3", "Infant 3.5", "Infant 4", "Infant 4.5",
  // Toddler
  "Toddler 5", "Toddler 5.5", "Toddler 6", "Toddler 6.5", "Toddler 7", "Toddler 7.5", "Toddler 8", "Toddler 8.5", "Toddler 9", "Toddler 9.5", "Toddler 10", "Toddler 10.5",
  // Kids
  "Kids 11", "Kids 11.5", "Kids 12", "Kids 12.5", "Kids 13", "Kids 13.5",
  // Youth
  "Youth 1", "Youth 1.5", "Youth 2", "Youth 2.5", "Youth 3", "Youth 3.5", "Youth 4", "Youth 4.5", "Youth 5", "Youth 5.5", "Youth 6", "Youth 6.5", "Youth 7",
  // Women's
  "Women's 5", "Women's 5.5", "Women's 6", "Women's 6.5", "Women's 7", "Women's 7.5",
  "Women's 8", "Women's 8.5", "Women's 9", "Women's 9.5", "Women's 10", "Women's 10.5", "Women's 11", "Women's 11.5", "Women's 12",
  // Men's
  "Men's 7", "Men's 7.5", "Men's 8", "Men's 8.5", "Men's 9", "Men's 9.5",
  "Men's 10", "Men's 10.5", "Men's 11", "Men's 11.5", "Men's 12", "Men's 12.5", "Men's 13", "Men's 13.5", "Men's 14"
];

// Hat sizes
const HAT_SIZES = ["Infant", "Toddler", "Kids", "Youth", "Adult S", "Adult M", "Adult L"];

// Gloves/Mittens sizes
const GLOVE_SIZES = ["Infant", "Toddler", "Kids S", "Kids M", "Kids L", "Youth", "Adult S", "Adult M", "Adult L"];

// Bike sizes
const BIKE_SIZES = ['12"', '14"', '16"', '18"', '20"', '24"', '26"', "Adult"];

// Helmet sizes
const HELMET_SIZES = ["Infant", "Toddler", "XS", "S", "M", "L", "XL"];

// Baseball glove sizes
const BASEBALL_GLOVE_SIZES = ['9"', '9.5"', '10"', '10.5"', '11"', '11.5"', '12"'];

type UnderneathMode = "none" | "diapers" | "pullups" | "underwear" | "bras";

function parseUnderneath(raw: string | null): { mode: UnderneathMode; size: string } {
  if (!raw) return { mode: "none", size: "" };

  const [label, ...rest] = raw.split(":");
  const size = rest.join(":").trim();

  const key = label.trim().toLowerCase();
  if (key === "diapers" || key === "diaper") return { mode: "diapers", size };
  if (key === "pull-ups" || key === "pullups" || key === "pull-up" || key === "pullup") return { mode: "pullups", size };
  if (key === "underwear") return { mode: "underwear", size };
  if (key === "bras" || key === "bra") return { mode: "bras", size };

  return { mode: "underwear", size: raw };
}

function buildUnderneath(mode: UnderneathMode, size: string): string | null {
  const s = size.trim();
  if (mode === "none" || !s) return null;

  if (mode === "diapers") return `Diapers: ${s}`;
  if (mode === "pullups") return `Pull-Ups: ${s}`;
  if (mode === "underwear") return `Underwear: ${s}`;
  if (mode === "bras") return `Bras: ${s}`;

  return null;
}

export default function KidsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newBirthdate, setNewBirthdate] = useState("");

  const selectedKid = useMemo(
    () => kids.find((k) => k.id === selectedKidId) ?? null,
    [kids, selectedKidId]
  );

  async function ensureProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.push("/login");
      return null;
    }
    await supabase.from("profiles").upsert({ id: user.id });
    return user.id;
  }

  async function loadKids() {
    setError(null);
    setLoading(true);

    const userId = await ensureProfile();
    if (!userId) return;

    const { data, error } = await supabase
      .from("kids")
      .select(
        `
        id,
        name,
        birthdate,
        avatar_url,
        kid_sizes ( clothing_top, clothing_bottom, shoe_size, pajamas, socks, underwear_size, diaper_or_underwear, notes ),
        kid_preferences ( interests, favorite_things, dislikes, allergies, colors, notes )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setKids([]);
      setSelectedKidId(null);
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((k: any) => {
      const sizes = Array.isArray(k.kid_sizes) ? k.kid_sizes[0] ?? null : k.kid_sizes ?? null;
      const prefsRaw = Array.isArray(k.kid_preferences)
        ? k.kid_preferences[0] ?? null
        : k.kid_preferences ?? null;

      const prefs: KidPreferences | null = prefsRaw
        ? {
            interests: prefsRaw.interests ?? [],
            favorite_things: prefsRaw.favorite_things ?? [],
            dislikes: prefsRaw.dislikes ?? [],
            allergies: prefsRaw.allergies ?? [],
            colors: prefsRaw.colors ?? [],
            notes: prefsRaw.notes ?? null,
          }
        : null;

      return {
        id: k.id,
        name: k.name,
        birthdate: k.birthdate ?? null,
        avatar_url: k.avatar_url ?? null,
        kid_sizes: sizes,
        kid_preferences: prefs,
      } as Kid;
    });

    setKids(normalized);
    setSelectedKidId(normalized[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadKids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addKid() {
    setError(null);
    const name = newName.trim();
    if (!name) return;

    setSaving("Adding kid...");
    const userId = await ensureProfile();
    if (!userId) return;

    const birthdate = newBirthdate ? newBirthdate : null;

    const { data: kidRow, error: kidErr } = await supabase
      .from("kids")
      .insert({ user_id: userId, name, birthdate })
      .select("id, name, birthdate")
      .single();

    if (kidErr || !kidRow) {
      setSaving(null);
      setError(kidErr?.message ?? "Could not add kid.");
      return;
    }

    await supabase.from("kid_sizes").insert({
      kid_id: kidRow.id,
      clothing_top: null,
      clothing_bottom: null,
      shoe_size: null,
      pajamas: null,
      socks: null,
      underwear_size: null,
      diaper_or_underwear: null,
      notes: null,
    });

    await supabase.from("kid_preferences").insert({
      kid_id: kidRow.id,
      interests: [],
      favorite_things: [],
      dislikes: [],
      allergies: [],
      colors: [],
      notes: null,
    });

    setNewName("");
    setNewBirthdate("");
    setSaving(null);

    await loadKids();
    setSelectedKidId(kidRow.id);
  }

  async function updateKid(kidId: string, name: string, birthdate: string | null) {
    setError(null);
    setSaving("Updating kid...");

    const { error } = await supabase
      .from("kids")
      .update({ name, birthdate })
      .eq("id", kidId);

    if (error) {
      setError(error.message);
    }

    setSaving(null);
    await loadKids();
  }

  async function deleteKid(kidId: string) {
    setError(null);
    setSaving("Deleting...");

    // Delete related data first
    await supabase.from("wishlists").delete().eq("kid_id", kidId);
    await supabase.from("kid_sizes").delete().eq("kid_id", kidId);
    await supabase.from("kid_preferences").delete().eq("kid_id", kidId);

    // Delete the kid
    const { error } = await supabase.from("kids").delete().eq("id", kidId);

    if (error) {
      setError(error.message);
    }

    setSaving(null);

    // Select another kid or null
    if (selectedKidId === kidId) {
      const remaining = kids.filter((k) => k.id !== kidId);
      setSelectedKidId(remaining[0]?.id ?? null);
    }

    await loadKids();
  }

  async function saveSizes(kidId: string, sizes: KidSizes | null) {
    setError(null);
    setSaving("Saving sizes...");

    const payload = {
      kid_id: kidId,
      clothing_top: sizes?.clothing_top ?? null,
      clothing_bottom: sizes?.clothing_bottom ?? null,
      shoe_size: sizes?.shoe_size ?? null,
      pajamas: sizes?.pajamas ?? null,
      socks: sizes?.socks ?? null,
      underwear_size: sizes?.underwear_size ?? null,
      diaper_or_underwear: sizes?.diaper_or_underwear ?? null,
      notes: sizes?.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("kid_sizes")
      .select("id")
      .eq("kid_id", kidId)
      .maybeSingle();

    const res = existing?.id
      ? await supabase.from("kid_sizes").update(payload).eq("kid_id", kidId)
      : await supabase.from("kid_sizes").insert(payload);

    if (res.error) setError(res.error.message);

    setSaving(null);
    await loadKids();
  }

  async function savePrefs(kidId: string, prefs: KidPreferences) {
    setError(null);
    setSaving("Saving preferences...");

    const payload = {
      kid_id: kidId,
      interests: prefs.interests ?? [],
      favorite_things: prefs.favorite_things ?? [],
      dislikes: prefs.dislikes ?? [],
      allergies: prefs.allergies ?? [],
      colors: prefs.colors ?? [],
      notes: prefs.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("kid_preferences")
      .select("id")
      .eq("kid_id", kidId)
      .maybeSingle();

    const res = existing?.id
      ? await supabase.from("kid_preferences").update(payload).eq("kid_id", kidId)
      : await supabase.from("kid_preferences").insert(payload);

    if (res.error) setError(res.error.message);

    setSaving(null);
    await loadKids();
  }

  async function updateKidAvatar(kidId: string, avatarUrl: string | null) {
    setError(null);

    const { error } = await supabase
      .from("kids")
      .update({ avatar_url: avatarUrl })
      .eq("id", kidId);

    if (error) {
      setError(error.message);
      return;
    }

    // Update local state
    setKids(kids.map(k =>
      k.id === kidId ? { ...k, avatar_url: avatarUrl } : k
    ));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Header Section */}
      <div className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            My Kids
          </h1>
          <p className="mt-2 text-lg text-foreground/50">
            Store sizes and preferences so wishlists + registries are always correct
          </p>

          {/* Section Navigation - Tabs */}
          <div className="flex items-center gap-1 mt-8 border-b border-gray-100">
            <Link
              href="/my-kids"
              className="px-5 py-3.5 text-sm font-medium border-b-2 border-red text-red"
            >
              My Kids
            </Link>
            <Link
              href="/collections"
              className="px-5 py-3.5 text-sm font-medium border-b-2 border-transparent text-foreground/50 hover:text-foreground transition-colors"
            >
              Collections
            </Link>
            <Link
              href="/registry"
              className="px-5 py-3.5 text-sm font-medium border-b-2 border-transparent text-foreground/50 hover:text-foreground transition-colors"
            >
              Registries
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 py-10">

        <div className="grid gap-8 md:grid-cols-3">
          {/* Sidebar */}
          <section className="rounded-3xl bg-gray-50/50 border border-gray-100 p-6">
            <div className="text-base font-semibold text-foreground">Add a kid</div>

            <div className="mt-5 space-y-4">
              <input
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:bg-white focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
                placeholder="Name (e.g., Roman)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm focus:bg-white focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
                type="date"
                value={newBirthdate}
                onChange={(e) => setNewBirthdate(e.target.value)}
              />
              <button
                className="w-full rounded-full bg-red px-6 py-4 text-sm font-semibold text-white hover:bg-red-hover transition-colors disabled:opacity-50 shadow-sm hover:shadow-md"
                onClick={addKid}
                disabled={!newName.trim() || !!saving}
              >
                Add Kid
              </button>
            </div>

            <div className="mt-8 border-t border-gray-200/60 pt-6">
              <div className="text-base font-semibold text-foreground">Your kids</div>
              {loading ? (
                <div className="mt-5 text-center py-4">
                  <div className="inline-block w-6 h-6 border-2 border-red/20 border-t-red rounded-full animate-spin" />
                  <p className="mt-3 text-sm text-foreground/40">Loading...</p>
                </div>
              ) : kids.length === 0 ? (
                <div className="mt-4 text-sm text-foreground/40">No kids yet. Add one above.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {kids.map((k) => (
                    <KidListItem
                      key={k.id}
                      kid={k}
                      isSelected={selectedKidId === k.id}
                      onSelect={() => setSelectedKidId(k.id)}
                      onUpdate={updateKid}
                      onDelete={deleteKid}
                      saving={saving}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Main Content */}
          <section className="md:col-span-2 rounded-3xl bg-gray-50/50 border border-gray-100 p-6 md:p-8">
            {!selectedKid ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-foreground/50">Select a kid to edit sizes, preferences, and wishlist.</p>
              </div>
            ) : (
              <KidEditor kid={selectedKid} saving={saving} onSaveSizes={saveSizes} onSavePrefs={savePrefs} onUpdateAvatar={updateKidAvatar} />
            )}

            {saving && (
              <div className="mt-6 rounded-2xl bg-gold-light border border-gold/20 px-5 py-4 text-sm text-foreground">
                {saving}
              </div>
            )}
            {error && (
              <div className="mt-6 rounded-2xl bg-red-light border border-red/20 px-5 py-4 text-sm text-red">
                {error}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function KidListItem({
  kid,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  saving,
}: {
  kid: Kid;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (kidId: string, name: string, birthdate: string | null) => Promise<void>;
  onDelete: (kidId: string) => Promise<void>;
  saving: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(kid.name);
  const [editBirthdate, setEditBirthdate] = useState(kid.birthdate || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) return;
    await onUpdate(kid.id, editName.trim(), editBirthdate || null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(kid.id);
    setShowDeleteConfirm(false);
  };

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-red/30 bg-red-light p-4 space-y-3">
        <input
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Name"
          autoFocus
        />
        <input
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
          type="date"
          value={editBirthdate}
          onChange={(e) => setEditBirthdate(e.target.value)}
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!!saving || !editName.trim()}
            className="flex-1 rounded-xl bg-red px-4 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditName(kid.name);
              setEditBirthdate(kid.birthdate || "");
            }}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="rounded-2xl border border-red/30 bg-red-light p-4 space-y-3">
        <div className="text-sm font-semibold text-red">Delete {kid.name}?</div>
        <div className="text-sm text-foreground/60">This will also delete their wishlist, sizes, and preferences.</div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDelete}
            disabled={!!saving}
            className="flex-1 rounded-xl bg-red px-4 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded-2xl border p-4 transition-all cursor-pointer",
        isSelected
          ? "border-red/30 bg-red-light shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
      ].join(" ")}
    >
      <button
        onClick={onSelect}
        className="w-full text-left"
      >
        <div className="font-semibold text-foreground">{kid.name}</div>
        <div className="text-sm text-foreground/50 mt-0.5">
          {kid.birthdate ? `Birthday: ${kid.birthdate}` : "Birthday not set"}
        </div>
      </button>
      <div className="mt-3 flex gap-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-foreground/50 hover:text-red transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-sm text-foreground/50 hover:text-red transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function KidEditor({
  kid,
  saving,
  onSaveSizes,
  onSavePrefs,
  onUpdateAvatar,
}: {
  kid: Kid;
  saving: string | null;
  onSaveSizes: (kidId: string, sizes: KidSizes | null) => Promise<void>;
  onSavePrefs: (kidId: string, prefs: KidPreferences) => Promise<void>;
  onUpdateAvatar: (kidId: string, avatarUrl: string | null) => Promise<void>;
}) {
  const [tab, setTab] = useState<"sizes" | "prefs" | "wishlist">("sizes");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(kid.avatar_url);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Update avatar when kid changes
  useEffect(() => {
    setAvatarUrl(kid.avatar_url);
  }, [kid.avatar_url, kid.id]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "kid-photos");

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
      await onUpdateAvatar(kid.id, url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const [sizes, setSizes] = useState<KidSizes>(
    kid.kid_sizes ?? {
      clothing_top: "",
      clothing_bottom: "",
      pajamas: "",
      shoe_size: "",
      socks: "",
      underwear_size: "",
      diaper_or_underwear: null,
      hat_size: "",
      gloves_size: "",
      bike_size: "",
      helmet_size: "",
      baseball_glove: "",
      sports_gear_notes: "",
      notes: "",
    }
  );

  const [prefs, setPrefs] = useState<KidPreferences>(
    kid.kid_preferences ?? {
      interests: [],
      favorite_things: [],
      dislikes: [],
      allergies: [],
      colors: [],
      notes: "",
    }
  );

  const parsed = useMemo(() => parseUnderneath(sizes.diaper_or_underwear ?? null), [sizes.diaper_or_underwear]);
  const [underneathMode, setUnderneathMode] = useState<UnderneathMode>(parsed.mode);
  const [underneathSize, setUnderneathSize] = useState<string>(parsed.size);

  useEffect(() => {
    const p = parseUnderneath(sizes.diaper_or_underwear ?? null);
    setUnderneathMode(p.mode);
    setUnderneathSize(p.size);
  }, [kid.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSizes((s) => ({
      ...s,
      diaper_or_underwear: buildUnderneath(underneathMode, underneathSize),
    }));
  }, [underneathMode, underneathSize]);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedProduct | null>(null);

  const loadWishlist = useCallback(async () => {
    const { data } = await supabase
      .from("wishlists")
      .select("*")
      .eq("kid_id", kid.id)
      .order("created_at", { ascending: false });

    setWishlist((data ?? []) as WishlistItem[]);
  }, [kid.id]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    setSizes(
      kid.kid_sizes ?? {
        clothing_top: "",
        clothing_bottom: "",
        pajamas: "",
        shoe_size: "",
        snow_boots: "",
        socks: "",
        underwear_size: "",
        diaper_or_underwear: null,
        hat_size: "",
        gloves_size: "",
        bike_size: "",
        helmet_size: "",
        baseball_glove: "",
        sports_gear_notes: "",
        notes: "",
      }
    );

    setPrefs(
      kid.kid_preferences ?? {
        interests: [],
        favorite_things: [],
        dislikes: [],
        allergies: [],
        colors: [],
        notes: "",
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kid.id]);

  const underneathSizeOptions = useMemo(() => {
    if (underneathMode === "diapers") return DIAPER_SIZES;
    if (underneathMode === "pullups") return PULLUP_SIZES;
    if (underneathMode === "underwear") return UNDERWEAR_SIZES;
    if (underneathMode === "bras") return BRA_SIZES;
    return [];
  }, [underneathMode]);

  // Auto-scrape when URL changes
  useEffect(() => {
    const url = newUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      setScrapedData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setScraping(true);
      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setScrapedData(data.data);
          // Auto-fill title if empty
          if (!newTitle && data.data.title) {
            setNewTitle(data.data.title);
          }
        }
      } catch {
        // Ignore scrape errors
      }
      setScraping(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [newUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addWishlistItem() {
    const url = newUrl.trim();
    if (!url) return;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    if (!/^https?:\/\//i.test(url)) {
      alert("Please paste a full URL starting with http:// or https://");
      return;
    }

    const { error } = await supabase.from("wishlists").insert({
      user_id: userId,
      kid_id: kid.id,
      url,
      title: newTitle.trim() || scrapedData?.title || null,
      notes: newNotes.trim() || null,
      image_url: scrapedData?.image_url || null,
      description: scrapedData?.description || null,
      price: scrapedData?.price || null,
      currency: scrapedData?.currency || "USD",
      original_url: url,
      affiliate_url: scrapedData?.affiliate_url || null,
      retailer: scrapedData?.retailer || null,
      asin: scrapedData?.asin || null,
      status: "available",
      priority: 0,
      quantity: 1,
      quantity_claimed: 0,
      last_scraped_at: scrapedData ? new Date().toISOString() : null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewUrl("");
    setNewTitle("");
    setNewNotes("");
    setScrapedData(null);
    await loadWishlist();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar with upload */}
          <div
            className="relative cursor-pointer group"
            onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
          >
            <Avatar
              src={avatarUrl}
              name={kid.name}
              size="xl"
              className="border-4 border-white shadow-md"
            />
            <div className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-foreground">{kid.name}</div>
            <div className="text-sm text-foreground/50 mt-1">
              {kid.birthdate ? `Birthday: ${kid.birthdate}` : "Birthday not set"}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <TabButton active={tab === "sizes"} onClick={() => setTab("sizes")}>Sizes</TabButton>
          <TabButton active={tab === "prefs"} onClick={() => setTab("prefs")}>Preferences</TabButton>
          <TabButton active={tab === "wishlist"} onClick={() => setTab("wishlist")}>Wishlist</TabButton>
        </div>
      </div>

      {tab === "sizes" && (
        <SizesForm
          sizes={sizes}
          setSizes={setSizes}
          underneathMode={underneathMode}
          underneathSize={underneathSize}
          underneathSizeOptions={underneathSizeOptions}
          setUnderneathMode={setUnderneathMode}
          setUnderneathSize={setUnderneathSize}
          saving={saving}
          onSave={() => onSaveSizes(kid.id, sizes)}
        />
      )}

      {tab === "prefs" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="text-base font-semibold text-foreground mb-5">Likes & Interests</div>
            <div className="grid gap-6 md:grid-cols-2">
              <TagInput label="Interests" value={prefs.interests} onChange={(v) => setPrefs((p) => ({ ...p, interests: v }))} placeholder="Legos" />
              <TagInput label="Favorite things" value={prefs.favorite_things} onChange={(v) => setPrefs((p) => ({ ...p, favorite_things: v }))} placeholder="Spider-Man" />
              <TagInput label="Favorite colors" value={prefs.colors} onChange={(v) => setPrefs((p) => ({ ...p, colors: v }))} placeholder="Blue" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="text-base font-semibold text-foreground mb-5">Good to Know</div>
            <div className="grid gap-6 md:grid-cols-2">
              <TagInput label="Dislikes" value={prefs.dislikes} onChange={(v) => setPrefs((p) => ({ ...p, dislikes: v }))} placeholder="Slime" />
              <TagInput label="Allergies" value={prefs.allergies} onChange={(v) => setPrefs((p) => ({ ...p, allergies: v }))} placeholder="Peanuts" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <TextArea
              label="Notes for gift givers"
              value={prefs.notes ?? ""}
              onChange={(v) => setPrefs((p) => ({ ...p, notes: v }))}
              placeholder="Gift rules: no screens, no tiny parts, etc."
            />
          </div>

          <div>
            <button
              disabled={!!saving}
              onClick={() => onSavePrefs(kid.id, prefs)}
              className="rounded-full bg-red px-8 py-4 text-sm font-semibold text-white hover:bg-red-hover transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}

      {tab === "wishlist" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="text-base font-semibold text-foreground mb-5">Add an item</div>
            <input
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm placeholder:text-foreground/40 focus:bg-white focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
              placeholder="Paste product URL (Amazon, Target, any site)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />

            {scraping && (
              <div className="mt-4 flex items-center gap-2 text-sm text-foreground/50">
                <div className="w-4 h-4 border-2 border-red/20 border-t-red rounded-full animate-spin" />
                Fetching product info...
              </div>
            )}

            {scrapedData && !scraping && (
              <div className="mt-4 flex gap-4 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                {scrapedData.image_url && (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image
                      src={scrapedData.image_url}
                      alt={scrapedData.title || "Product"}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground line-clamp-2">
                    {scrapedData.title || "No title found"}
                  </div>
                  {scrapedData.price && (
                    <div className="mt-1.5 text-sm font-semibold text-gold">
                      ${scrapedData.price.toFixed(2)}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-foreground/50">
                    <span className="capitalize">{scrapedData.retailer}</span>
                    {scrapedData.affiliate_url && (
                      <span className="rounded-full bg-gold-light px-2 py-0.5 text-gold border border-gold/20">
                        Affiliate
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <input
              className="mt-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm placeholder:text-foreground/40 focus:bg-white focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
              placeholder="Optional title (e.g., Lego fire station)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <TextArea
              label=""
              value={newNotes}
              onChange={setNewNotes}
              placeholder="Why they want it, size/color notes, etc."
            />

            <button
              className="mt-4 rounded-full bg-red px-6 py-4 text-sm font-semibold text-white hover:bg-red-hover transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              onClick={addWishlistItem}
              disabled={!newUrl.trim() || scraping}
            >
              Add to wishlist
            </button>
          </div>

          <div className="space-y-4">
            {wishlist.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-gray-100 bg-white">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="text-foreground/40">No wishlist items yet</p>
                <p className="text-sm text-foreground/30 mt-1">Paste a product URL above to get started</p>
              </div>
            ) : (
              wishlist.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  onRemove={async () => {
                    await supabase.from("wishlists").delete().eq("id", item.id);
                    await loadWishlist();
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WishlistCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: () => Promise<void>;
}) {
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const displayUrl = item.affiliate_url || item.url;

  const statusColors: Record<WishlistStatus, string> = {
    available: "bg-gold-light text-gold border border-gold/30",
    reserved: "bg-gray-100 text-foreground/70 border border-gray-200",
    purchased: "bg-gray-50 text-foreground/50 border border-gray-200",
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex gap-4">
          {item.image_url && (
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
              <Image
                src={item.image_url}
                alt={item.title || "Product"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium text-foreground line-clamp-2">
                {item.title || item.url}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowAddToCollection(true)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-foreground/50 hover:bg-red/10 hover:text-red transition-colors"
                  title="Add to collection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button
                  onClick={onRemove}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-foreground/50 hover:bg-red/10 hover:text-red transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.price && (
                <span className="font-semibold text-gold">
                  ${item.price.toFixed(2)}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[item.status]}`}>
                {item.status}
              </span>
              {item.retailer && (
                <span className="text-sm text-foreground/40 capitalize">{item.retailer}</span>
              )}
              {item.affiliate_url && (
                <span className="rounded-full bg-gold-light px-2.5 py-1 text-xs text-gold border border-gold/20">
                  Affiliate
                </span>
              )}
              {item.quantity > 1 && (
                <span className="text-sm text-foreground/40">
                  Qty: {item.quantity_claimed}/{item.quantity}
                </span>
              )}
            </div>

            {item.notes && (
              <div className="mt-2 text-sm text-foreground/50 line-clamp-2">{item.notes}</div>
            )}

            <div className="mt-3 flex items-center gap-4">
              <a
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-red hover:text-red-hover transition-colors font-medium"
              >
                View product
              </a>
              <button
                onClick={() => setShowAddToCollection(true)}
                className="text-sm text-foreground/50 hover:text-red transition-colors"
              >
                + Add to collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddToCollection && (
        <AddToCollectionModal
          item={item}
          onClose={() => setShowAddToCollection(false)}
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-5 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-red text-white shadow-sm"
          : "bg-white text-foreground/70 border border-gray-200 hover:border-gray-300 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { label: string; value: string })[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>
      <select
        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm disabled:opacity-50 appearance-none focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '3rem' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === "string" ? { label: o, value: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(text: string) {
    const cleaned = text.trim().replace(/,+$/, "");
    if (!cleaned) return;
    const next = Array.from(new Set([...(value ?? []), cleaned]));
    onChange(next);
    setDraft("");
  }

  function remove(tag: string) {
    onChange((value ?? []).filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>

      <div className="flex flex-wrap gap-2">
        {(value ?? []).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => remove(t)}
            className="rounded-full border border-red/20 bg-red-light px-4 py-1.5 text-sm text-red hover:bg-red/10 transition-colors"
            title="Click to remove"
          >
            {t} &times;
          </button>
        ))}
      </div>

      <input
        className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
        placeholder={placeholder ?? "Type and press Enter"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(draft);
          }
        }}
        onBlur={() => commit(draft)}
      />

      <div className="mt-2 text-xs text-foreground/40">
        Press <span className="font-medium">Enter</span> or{" "}
        <span className="font-medium">,</span> to add. Click a tag to remove.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>
      <input
        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      {label && <div className="text-sm font-medium text-foreground mb-2">{label}</div>}
      <textarea
        className={`${label ? "" : "mt-3"} w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all`}
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectWithOther({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const isCustomValue = value && !options.includes(value);
  const [showCustom, setShowCustom] = useState(isCustomValue);
  const [customValue, setCustomValue] = useState(isCustomValue ? value : "");

  // Sync custom input when value changes externally
  useEffect(() => {
    const isCustom = value && !options.includes(value);
    if (isCustom) {
      setShowCustom(true);
      setCustomValue(value);
    } else {
      setShowCustom(false);
      setCustomValue("");
    }
  }, [value, options]);

  return (
    <div className="relative">
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>
      {!showCustom ? (
        <select
          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm appearance-none focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '3rem' }}
          value={value}
          onChange={(e) => {
            if (e.target.value === "__other__") {
              setShowCustom(true);
              onChange("");
            } else {
              onChange(e.target.value);
            }
          }}
        >
          <option value="">{placeholder || "Select"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="__other__">Other (custom)</option>
        </select>
      ) : (
        <div className="relative">
          <input
            type="text"
            className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pr-12 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
            placeholder="Enter custom size"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value);
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              setShowCustom(false);
              setCustomValue("");
              onChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-foreground/40 hover:bg-gray-200 hover:text-foreground/60 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function UnderneathSelector({
  mode,
  size,
  sizeOptions,
  onModeChange,
  onSizeChange,
}: {
  mode: UnderneathMode;
  size: string;
  sizeOptions: string[];
  onModeChange: (m: UnderneathMode) => void;
  onSizeChange: (s: string) => void;
}) {
  const isCustomSize = size && sizeOptions.length > 0 && !sizeOptions.includes(size);
  const [showCustom, setShowCustom] = useState(isCustomSize);
  const [customValue, setCustomValue] = useState(isCustomSize ? size : "");

  useEffect(() => {
    const isCustom = size && sizeOptions.length > 0 && !sizeOptions.includes(size);
    if (isCustom) {
      setShowCustom(true);
      setCustomValue(size);
    } else {
      setShowCustom(false);
      setCustomValue("");
    }
  }, [size, sizeOptions]);

  const selectStyle = {
    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
    backgroundPosition: 'right 1rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.25em 1.25em',
    paddingRight: '3rem'
  } as React.CSSProperties;

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground mb-2">Type</div>
        <select
          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm appearance-none focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
          style={selectStyle}
          value={mode}
          onChange={(e) => {
            onModeChange(e.target.value as UnderneathMode);
            setShowCustom(false);
            setCustomValue("");
          }}
        >
          <option value="none">None</option>
          <option value="diapers">Diapers</option>
          <option value="pullups">Pull-Ups</option>
          <option value="underwear">Underwear</option>
          <option value="bras">Bras</option>
        </select>
      </div>

      {mode !== "none" && (
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground mb-2">Size</div>
          {!showCustom ? (
            <select
              className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm appearance-none focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
              style={selectStyle}
              value={size}
              onChange={(e) => {
                if (e.target.value === "__other__") {
                  setShowCustom(true);
                  onSizeChange("");
                } else {
                  onSizeChange(e.target.value);
                }
              }}
            >
              <option value="">Select size</option>
              {sizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="__other__">Other (custom)</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
                placeholder="Custom size"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  onSizeChange(e.target.value);
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustom(false);
                  setCustomValue("");
                  onSizeChange("");
                }}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SizesForm({
  sizes,
  setSizes,
  underneathMode,
  underneathSize,
  underneathSizeOptions,
  setUnderneathMode,
  setUnderneathSize,
  saving,
  onSave,
}: {
  sizes: KidSizes;
  setSizes: React.Dispatch<React.SetStateAction<KidSizes>>;
  underneathMode: UnderneathMode;
  underneathSize: string;
  underneathSizeOptions: string[];
  setUnderneathMode: (m: UnderneathMode) => void;
  setUnderneathSize: (s: string) => void;
  saving: string | null;
  onSave: () => void;
}) {
  const [showSportsGear, setShowSportsGear] = useState(
    !!(sizes.bike_size || sizes.helmet_size || sizes.baseball_glove || sizes.sports_gear_notes)
  );

  return (
    <div className="mt-8 space-y-8">
      {/* Section 1: Clothing */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="text-base font-semibold text-foreground mb-5">Clothing</div>
        <div className="grid gap-5 md:grid-cols-3">
          <SelectWithOther
            label="Clothing Top"
            value={sizes.clothing_top ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, clothing_top: v || null }))}
            options={CLOTHING_SIZES}
            placeholder="Select size"
          />
          <SelectWithOther
            label="Clothing Bottom"
            value={sizes.clothing_bottom ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, clothing_bottom: v || null }))}
            options={CLOTHING_SIZES}
            placeholder="Select size"
          />
          <SelectWithOther
            label="Pajamas"
            value={sizes.pajamas ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, pajamas: v || null }))}
            options={CLOTHING_SIZES}
            placeholder="Select size"
          />
        </div>
      </div>

      {/* Section 2: Shoes & Feet */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="text-base font-semibold text-foreground mb-5">Shoes & Feet</div>
        <div className="grid gap-5 md:grid-cols-2">
          <SelectWithOther
            label="Shoe Size"
            value={sizes.shoe_size ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, shoe_size: v || null }))}
            options={SHOE_SIZES}
            placeholder="Select size"
          />
          <SelectWithOther
            label="Socks"
            value={sizes.socks ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, socks: v || null }))}
            options={SOCK_SIZES}
            placeholder="Select size"
          />
        </div>
      </div>

      {/* Section 3: The Basics */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="text-base font-semibold text-foreground mb-5">The Basics</div>
        <div className="grid gap-5 md:grid-cols-1">
          <UnderneathSelector
            mode={underneathMode}
            size={underneathSize}
            sizeOptions={underneathSizeOptions}
            onModeChange={(m) => {
              setUnderneathMode(m);
              setUnderneathSize("");
            }}
            onSizeChange={setUnderneathSize}
          />
        </div>
      </div>

      {/* Section 4: Accessories */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="text-base font-semibold text-foreground mb-5">Accessories</div>
        <div className="grid gap-5 md:grid-cols-2">
          <SelectWithOther
            label="Hat Size"
            value={sizes.hat_size ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, hat_size: v || null }))}
            options={HAT_SIZES}
            placeholder="Select size"
          />
          <SelectWithOther
            label="Gloves / Mittens"
            value={sizes.gloves_size ?? ""}
            onChange={(v) => setSizes((s) => ({ ...s, gloves_size: v || null }))}
            options={GLOVE_SIZES}
            placeholder="Select size"
          />
        </div>
      </div>

      {/* Section 5: Sports & Gear (collapsible) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <button
          type="button"
          onClick={() => setShowSportsGear(!showSportsGear)}
          className="flex items-center gap-3 text-base font-semibold text-foreground hover:text-red transition-colors"
        >
          <span className={`w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-200 ${showSportsGear ? 'bg-red text-white rotate-180' : 'text-foreground/50'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
          Sports & Gear
          <span className="text-sm font-normal text-foreground/40">(optional)</span>
        </button>

        {showSportsGear && (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SelectWithOther
              label="Bike Size"
              value={sizes.bike_size ?? ""}
              onChange={(v) => setSizes((s) => ({ ...s, bike_size: v || null }))}
              options={BIKE_SIZES}
              placeholder="Select size"
            />
            <SelectWithOther
              label="Helmet Size"
              value={sizes.helmet_size ?? ""}
              onChange={(v) => setSizes((s) => ({ ...s, helmet_size: v || null }))}
              options={HELMET_SIZES}
              placeholder="Select size"
            />
            <SelectWithOther
              label="Baseball Glove"
              value={sizes.baseball_glove ?? ""}
              onChange={(v) => setSizes((s) => ({ ...s, baseball_glove: v || null }))}
              options={BASEBALL_GLOVE_SIZES}
              placeholder="Select size"
            />
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Other Sports Gear</div>
              <textarea
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm placeholder:text-foreground/40 focus:border-red/30 focus:ring-2 focus:ring-red/10 transition-all"
                rows={2}
                value={sizes.sports_gear_notes ?? ""}
                placeholder="Cleats, shin guards, etc."
                onChange={(e) => setSizes((s) => ({ ...s, sports_gear_notes: e.target.value || null }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* General Notes */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <TextArea
          label="Notes"
          value={sizes.notes ?? ""}
          onChange={(v) => setSizes((s) => ({ ...s, notes: v }))}
          placeholder="Brands that fit best, sensory notes, etc."
        />
      </div>

      {/* Save Button */}
      <div>
        <button
          disabled={!!saving}
          onClick={onSave}
          className="rounded-full bg-red px-8 py-4 text-sm font-semibold text-white hover:bg-red-hover transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        >
          Save sizes
        </button>
      </div>
    </div>
  );
}
