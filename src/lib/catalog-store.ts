import { MEDIA_URLS, PIZZA_IMAGES } from "@/lib/media";
import {
  hasServiceRoleKey,
  isServerSupabaseConfigured,
  supabaseAdmin,
} from "@/lib/supabase-admin";
import { roundCurrency, slugify } from "@/lib/utils";
import type {
  CatalogSnapshot,
  Combo,
  ComboDrinkSlot,
  ComboPizzaSlot,
  CrustOption,
  DeliveryBairro,
  Drink,
  ExtraIngredient,
  Pizza,
  PizzaCategory,
} from "@/types";

async function withTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs = 3500
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function mapPizzaRow(row: Record<string, unknown>, idx: number): Pizza {
  const category: PizzaCategory = row.category === "doce" ? "doce" : "salgada";
  const imageUrl =
    typeof row.image_url === "string" && row.image_url.trim()
      ? row.image_url.trim()
      : undefined;
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    desc: String(row.description ?? ""),
    p: roundCurrency(Number(row.price_p ?? 0)),
    m: roundCurrency(Number(row.price_m ?? 0)),
    g: roundCurrency(Number(row.price_g ?? 0)),
    category,
    imgIdx: 1 + (idx % Math.max(1, PIZZA_IMAGES.length - 1)),
    image: imageUrl,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    highlight: Boolean(row.highlight),
    available: row.available !== false,
    sortOrder: Number(row.sort_order ?? idx),
  };
}

function mapDrinkRow(row: Record<string, unknown>, idx: number): Drink {
  const imageUrl =
    typeof row.image_url === "string" && row.image_url.trim()
      ? row.image_url.trim()
      : undefined;
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name),
    desc: String(row.description ?? ""),
    price: roundCurrency(Number(row.price ?? 0)),
    icon: String(row.icon || "coca"),
    image: imageUrl,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    available: row.available !== false,
    sortOrder: Number(row.sort_order ?? idx),
  };
}

function mapComboRow(row: Record<string, unknown>, idx: number): Combo {
  const imageUrl =
    typeof row.image_url === "string" && row.image_url.trim()
      ? row.image_url.trim()
      : MEDIA_URLS.comboPizzaria;
  const pizzaSlots = Array.isArray(row.pizza_slots)
    ? (row.pizza_slots as ComboPizzaSlot[])
    : [];
  const drinkSlots = Array.isArray(row.drink_slots)
    ? (row.drink_slots as ComboDrinkSlot[])
    : undefined;
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name),
    desc: String(row.description ?? ""),
    price: roundCurrency(Number(row.price ?? 0)),
    originalPrice: roundCurrency(Number(row.original_price ?? row.price ?? 0)),
    image: imageUrl,
    items: Array.isArray(row.items) ? row.items.map(String) : [],
    pizzaSlots:
      pizzaSlots.length > 0
        ? pizzaSlots
        : [
            {
              label: "Pizza Grande (8 fatias)",
              category: "salgada",
              size: "G",
              allowHalf: true,
            },
          ],
    drinkSlots,
    fixedDrinkLabel:
      typeof row.fixed_drink_label === "string" && row.fixed_drink_label.trim()
        ? row.fixed_drink_label.trim()
        : undefined,
    available: row.available !== false,
    sortOrder: Number(row.sort_order ?? idx),
  };
}

function mapCrustRow(row: Record<string, unknown>, idx: number): CrustOption {
  const compat = Array.isArray(row.compatible_with)
    ? row.compatible_with.filter(
        (v): v is PizzaCategory => v === "salgada" || v === "doce"
      )
    : (["salgada"] as PizzaCategory[]);
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name),
    price: roundCurrency(Number(row.price ?? 0)),
    compatibleWith: compat.length > 0 ? compat : ["salgada"],
    available: row.available !== false,
    sortOrder: Number(row.sort_order ?? idx),
  };
}

function mapExtraRow(
  row: Record<string, unknown>,
  idx: number
): ExtraIngredient {
  const compat = Array.isArray(row.compatible_with)
    ? row.compatible_with.filter(
        (v): v is PizzaCategory => v === "salgada" || v === "doce"
      )
    : (["salgada"] as PizzaCategory[]);
  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name),
    price: roundCurrency(Number(row.price ?? 0)),
    compatibleWith: compat.length > 0 ? compat : ["salgada"],
    available: row.available !== false,
    sortOrder: Number(row.sort_order ?? idx),
  };
}

function mapBairroRow(
  row: Record<string, unknown>,
  idx: number
): DeliveryBairro {
  return {
    id: String(row.id),
    nome: String(row.name),
    frete: roundCurrency(Number(row.fee ?? 0)),
    active: row.active !== false,
    sortOrder: Number(row.sort_order ?? idx),
  };
}

export async function getFullCatalog(): Promise<CatalogSnapshot> {
  if (isServerSupabaseConfigured && supabaseAdmin) {
    const client = supabaseAdmin;
    const [pRes, dRes, cRes, crRes, eRes, bRes] = await Promise.all([
      withTimeout(
        client
          .from("pizzas")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      ),
      withTimeout(
        client
          .from("drinks")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      ),
      withTimeout(
        client
          .from("combos")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      ),
      withTimeout(
        client
          .from("crust_options")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("price", { ascending: true })
      ),
      withTimeout(
        client
          .from("extra_ingredients")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      ),
      withTimeout(
        client
          .from("delivery_neighborhoods")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      ),
    ]);

    const tablesReachable = Boolean(
      pRes && !pRes.error && dRes && !dRes.error && cRes && !cRes.error
    );

    if (tablesReachable) {
      const dbPizzas = Array.isArray(pRes?.data)
        ? pRes.data.map((r, i) => mapPizzaRow(r as Record<string, unknown>, i))
        : [];
      const dbDrinks = Array.isArray(dRes?.data)
        ? dRes.data.map((r, i) => mapDrinkRow(r as Record<string, unknown>, i))
        : [];
      const dbCombos = Array.isArray(cRes?.data)
        ? cRes.data.map((r, i) => mapComboRow(r as Record<string, unknown>, i))
        : [];
      const dbCrusts =
        crRes && !crRes.error && Array.isArray(crRes.data)
          ? crRes.data.map((r, i) =>
              mapCrustRow(r as Record<string, unknown>, i)
            )
          : [];
      const dbExtras =
        eRes && !eRes.error && Array.isArray(eRes.data)
          ? eRes.data.map((r, i) =>
              mapExtraRow(r as Record<string, unknown>, i)
            )
          : [];
      const dbBairros =
        bRes && !bRes.error && Array.isArray(bRes.data)
          ? bRes.data.map((r, i) =>
              mapBairroRow(r as Record<string, unknown>, i)
            )
          : [];

      return {
        source: "supabase",
        supabaseConnected: true,
        hasServiceRoleKey,
        needsSeed: false,
        pizzas: dbPizzas,
        drinks: dbDrinks,
        combos: dbCombos,
        crusts: dbCrusts,
        extras: dbExtras,
        bairros: dbBairros,
      };
    }
  }

  return {
    source: "defaults",
    supabaseConnected: false,
    hasServiceRoleKey,
    needsSeed: false,
    pizzas: [],
    drinks: [],
    combos: [],
    crusts: [],
    extras: [],
    bairros: [],
  };
}

function isUuid(value?: string): boolean {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function assertSupabaseWriteClient() {
  if (!isServerSupabaseConfigured || !supabaseAdmin || !hasServiceRoleKey) {
    throw new Error(
      "Supabase não configurado com SUPABASE_SERVICE_ROLE_KEY no servidor."
    );
  }
  return supabaseAdmin;
}

// ---------- CRUD PIZZAS ----------
export interface PizzaUpsertInput {
  id?: string;
  name: string;
  desc: string;
  category: PizzaCategory;
  p: number;
  m: number;
  g: number;
  image?: string;
  tags: string[];
  highlight?: boolean;
  available?: boolean;
}

export async function upsertPizza(input: PizzaUpsertInput): Promise<void> {
  const client = assertSupabaseWriteClient();
  const name = input.name.trim();
  const slug = slugify(name);
  const imageUrl = input.image?.trim() || null;
  const tags = input.tags.map((t) => t.trim()).filter(Boolean);

  const payload = {
    slug,
    name,
    description: input.desc.trim(),
    category: input.category,
    price_p: roundCurrency(input.p),
    price_m: roundCurrency(input.m),
    price_g: roundCurrency(input.g),
    image_url: imageUrl,
    tags,
    highlight: Boolean(input.highlight),
    available: input.available !== false,
    updated_at: new Date().toISOString(),
  };

  const res = isUuid(input.id)
    ? await client.from("pizzas").update(payload).eq("id", input.id!)
    : await client.from("pizzas").upsert(payload, { onConflict: "slug" });

  if (res.error) throw new Error(res.error.message);
}

export async function deletePizza(id: string): Promise<void> {
  const client = assertSupabaseWriteClient();
  const { error } = await client.from("pizzas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- CRUD DRINKS ----------
export interface DrinkUpsertInput {
  id?: string;
  name: string;
  desc: string;
  price: number;
  icon: string;
  image?: string;
  tags: string[];
  available?: boolean;
}

export async function upsertDrink(input: DrinkUpsertInput): Promise<void> {
  const client = assertSupabaseWriteClient();
  const name = input.name.trim();
  const slug = slugify(name);
  const imageUrl = input.image?.trim() || null;
  const tags = input.tags.map((t) => t.trim()).filter(Boolean);

  const payload = {
    slug,
    name,
    description: input.desc.trim(),
    price: roundCurrency(input.price),
    icon: input.icon || "coca",
    image_url: imageUrl,
    tags,
    available: input.available !== false,
    updated_at: new Date().toISOString(),
  };

  const res = isUuid(input.id)
    ? await client.from("drinks").update(payload).eq("id", input.id!)
    : await client.from("drinks").upsert(payload, { onConflict: "slug" });

  if (res.error) throw new Error(res.error.message);
}

export async function deleteDrink(id: string): Promise<void> {
  const client = assertSupabaseWriteClient();
  const { error } = await client.from("drinks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- CRUD COMBOS ----------
export interface ComboUpsertInput {
  id?: string;
  name: string;
  desc: string;
  price: number;
  originalPrice: number;
  image?: string;
  items: string[];
  pizzaSlots: ComboPizzaSlot[];
  drinkSlots?: ComboDrinkSlot[];
  fixedDrinkLabel?: string;
  available?: boolean;
}

export async function upsertCombo(input: ComboUpsertInput): Promise<void> {
  const client = assertSupabaseWriteClient();
  const name = input.name.trim();
  const slug = slugify(name);
  const imageUrl = input.image?.trim() || MEDIA_URLS.comboPizzaria;
  const items = input.items.map((i) => i.trim()).filter(Boolean);

  const payload = {
    slug,
    name,
    description: input.desc.trim(),
    price: roundCurrency(input.price),
    original_price: roundCurrency(input.originalPrice),
    image_url: imageUrl,
    items,
    pizza_slots: input.pizzaSlots,
    drink_slots:
      input.drinkSlots && input.drinkSlots.length > 0 ? input.drinkSlots : null,
    fixed_drink_label: input.fixedDrinkLabel?.trim() || null,
    available: input.available !== false,
    updated_at: new Date().toISOString(),
  };

  const res = isUuid(input.id)
    ? await client.from("combos").update(payload).eq("id", input.id!)
    : await client.from("combos").upsert(payload, { onConflict: "slug" });

  if (res.error) throw new Error(res.error.message);
}

export async function deleteCombo(id: string): Promise<void> {
  const client = assertSupabaseWriteClient();
  const { error } = await client.from("combos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- CRUD CRUSTS & EXTRAS ----------
export interface ModifierUpsertInput {
  id?: string;
  name: string;
  price: number;
  compatibleWith: PizzaCategory[];
  available?: boolean;
}

export async function upsertCrust(input: ModifierUpsertInput): Promise<void> {
  const client = assertSupabaseWriteClient();
  const name = input.name.trim();
  const slug = slugify(name);
  const compat: PizzaCategory[] =
    input.compatibleWith.length > 0 ? input.compatibleWith : ["salgada"];

  const payload = {
    slug,
    name,
    price: roundCurrency(input.price),
    compatible_with: compat,
    available: input.available !== false,
    updated_at: new Date().toISOString(),
  };

  const res = isUuid(input.id)
    ? await client.from("crust_options").update(payload).eq("id", input.id!)
    : await client
        .from("crust_options")
        .upsert(payload, { onConflict: "slug" });

  if (res.error) throw new Error(res.error.message);
}

export async function deleteCrust(id: string): Promise<void> {
  const client = assertSupabaseWriteClient();
  const { error } = await client.from("crust_options").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function upsertExtra(input: ModifierUpsertInput): Promise<void> {
  const client = assertSupabaseWriteClient();
  const name = input.name.trim();
  const slug = slugify(name);
  const compat: PizzaCategory[] =
    input.compatibleWith.length > 0 ? input.compatibleWith : ["salgada"];

  const payload = {
    slug,
    name,
    price: roundCurrency(input.price),
    compatible_with: compat,
    available: input.available !== false,
    updated_at: new Date().toISOString(),
  };

  const res = isUuid(input.id)
    ? await client.from("extra_ingredients").update(payload).eq("id", input.id!)
    : await client
        .from("extra_ingredients")
        .upsert(payload, { onConflict: "slug" });

  if (res.error) throw new Error(res.error.message);
}

export async function deleteExtra(id: string): Promise<void> {
  const client = assertSupabaseWriteClient();
  const { error } = await client
    .from("extra_ingredients")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- CRUD BAIRROS ----------
export interface BairroUpsertInput {
  id?: string;
  nome: string;
  frete: number;
  active?: boolean;
}

export async function upsertBairro(input: BairroUpsertInput): Promise<void> {
  const client = assertSupabaseWriteClient();
  const name = input.nome.trim();
  const payload = {
    name,
    fee: roundCurrency(input.frete),
    active: input.active !== false,
    updated_at: new Date().toISOString(),
  };

  const res = isUuid(input.id)
    ? await client
        .from("delivery_neighborhoods")
        .update(payload)
        .eq("id", input.id!)
    : await client
        .from("delivery_neighborhoods")
        .upsert(payload, { onConflict: "name" });

  if (res.error) throw new Error(res.error.message);
}

export async function deleteBairro(id: string): Promise<void> {
  const client = assertSupabaseWriteClient();
  const { error } = await client
    .from("delivery_neighborhoods")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- DISPONIBILIDADE UNIFICADA (PIZZAS / DRINKS / COMBOS) ----------
export function extractPausedItemNames(catalog: CatalogSnapshot): string[] {
  return [
    ...catalog.pizzas.filter((p) => p.available === false).map((p) => p.name),
    ...catalog.drinks.filter((d) => d.available === false).map((d) => d.name),
    ...catalog.combos.filter((c) => c.available === false).map((c) => c.name),
  ];
}

export async function setCatalogItemAvailability(
  itemName: string,
  available: boolean
): Promise<{
  ok: boolean;
  paused: string[];
  catalog: CatalogSnapshot;
  error?: string;
}> {
  const target = itemName.trim();
  const normalizedTarget = target.toLowerCase();
  const current = await getFullCatalog();

  if (!hasServiceRoleKey || !supabaseAdmin) {
    return {
      ok: false,
      paused: extractPausedItemNames(current),
      catalog: current,
      error:
        "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Adicione a chave Secret/service_role no .env.local e reinicie o servidor.",
    };
  }

  const now = new Date().toISOString();
  const pizza = current.pizzas.find(
    (p) => p.name.toLowerCase() === normalizedTarget
  );
  const drink = !pizza
    ? current.drinks.find((d) => d.name.toLowerCase() === normalizedTarget)
    : undefined;
  const combo =
    !pizza && !drink
      ? current.combos.find((c) => c.name.toLowerCase() === normalizedTarget)
      : undefined;

  let dbError: string | null = null;
  if (pizza && isUuid(pizza.id)) {
    const { error } = await supabaseAdmin
      .from("pizzas")
      .update({ available, updated_at: now })
      .eq("id", pizza.id);
    if (error) dbError = error.message;
  } else if (drink && isUuid(drink.id)) {
    const { error } = await supabaseAdmin
      .from("drinks")
      .update({ available, updated_at: now })
      .eq("id", drink.id);
    if (error) dbError = error.message;
  } else if (combo && isUuid(combo.id)) {
    const { error } = await supabaseAdmin
      .from("combos")
      .update({ available, updated_at: now })
      .eq("id", combo.id);
    if (error) dbError = error.message;
  } else {
    return {
      ok: false,
      paused: extractPausedItemNames(current),
      catalog: current,
      error: `Item "${target}" não encontrado nas tabelas do catálogo.`,
    };
  }

  if (dbError) {
    return {
      ok: false,
      paused: extractPausedItemNames(current),
      catalog: current,
      error: `Erro ao atualizar disponibilidade: ${dbError}`,
    };
  }

  const fresh = await getFullCatalog();
  return { ok: true, paused: extractPausedItemNames(fresh), catalog: fresh };
}
