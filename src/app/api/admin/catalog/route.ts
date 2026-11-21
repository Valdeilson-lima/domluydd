import { NextRequest, NextResponse } from "next/server";
import { applyRefreshedCookies, requireAdminSession } from "@/lib/admin-auth";
import {
  hasServiceRoleKey,
  isServerSupabaseConfigured,
} from "@/lib/supabase-admin";
import {
  deleteBairro,
  deleteCombo,
  deleteCrust,
  deleteDrink,
  deleteExtra,
  deletePizza,
  getFullCatalog,
  upsertBairro,
  upsertCombo,
  upsertCrust,
  upsertDrink,
  upsertExtra,
  upsertPizza,
} from "@/lib/catalog-store";
import type { ComboDrinkSlot, ComboPizzaSlot, PizzaCategory } from "@/types";

type ResourceKind = "pizza" | "drink" | "combo" | "crust" | "extra" | "bairro";

function parseNonNegNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseCategories(value: unknown): PizzaCategory[] {
  if (!Array.isArray(value)) return ["salgada"];
  const valid = value.filter(
    (v): v is PizzaCategory => v === "salgada" || v === "doce"
  );
  return valid.length > 0 ? valid : ["salgada"];
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const catalog = await getFullCatalog();
  return applyRefreshedCookies(
    NextResponse.json(catalog),
    auth.refreshedTokens
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const action = String(body?.action || "");

    if (isServerSupabaseConfigured && !hasServiceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Adicione a chave Secret (sb_secret_...) ou service_role do Supabase no .env.local e reinicie o servidor.",
        },
        { status: 503 }
      );
    }

    const resource = body?.resource as ResourceKind;
    const data = (body?.data ?? {}) as Record<string, unknown>;

    if (action === "delete") {
      const id = String(body?.id || data.id || "").trim();
      if (!id) {
        return NextResponse.json(
          { error: "ID do item é obrigatório para exclusão." },
          { status: 400 }
        );
      }

      if (resource === "pizza") await deletePizza(id);
      else if (resource === "drink") await deleteDrink(id);
      else if (resource === "combo") await deleteCombo(id);
      else if (resource === "crust") await deleteCrust(id);
      else if (resource === "extra") await deleteExtra(id);
      else if (resource === "bairro") await deleteBairro(id);
      else {
        return NextResponse.json(
          { error: "Tipo de recurso inválido." },
          { status: 400 }
        );
      }

      const catalog = await getFullCatalog();
      return applyRefreshedCookies(
        NextResponse.json({ ok: true, catalog }),
        auth.refreshedTokens
      );
    }

    if (action === "upsert") {
      if (resource === "pizza") {
        const name = String(data.name || "").trim();
        if (name.length < 2) {
          return NextResponse.json(
            { error: "Informe o nome do sabor (mínimo 2 letras)." },
            { status: 400 }
          );
        }
        await upsertPizza({
          id: typeof data.id === "string" ? data.id : undefined,
          name,
          desc: String(data.desc || ""),
          category: data.category === "doce" ? "doce" : "salgada",
          p: parseNonNegNumber(data.p),
          m: parseNonNegNumber(data.m),
          g: parseNonNegNumber(data.g),
          image: typeof data.image === "string" ? data.image : undefined,
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          highlight: Boolean(data.highlight),
          available: data.available !== false,
        });
      } else if (resource === "drink") {
        const name = String(data.name || "").trim();
        if (name.length < 2) {
          return NextResponse.json(
            { error: "Informe o nome da bebida." },
            { status: 400 }
          );
        }
        await upsertDrink({
          id: typeof data.id === "string" ? data.id : undefined,
          name,
          desc: String(data.desc || ""),
          price: parseNonNegNumber(data.price),
          icon: String(data.icon || "coca"),
          image: typeof data.image === "string" ? data.image : undefined,
          tags: Array.isArray(data.tags) ? data.tags.map(String) : ["Gelados"],
          available: data.available !== false,
        });
      } else if (resource === "combo") {
        const name = String(data.name || "").trim();
        if (name.length < 2) {
          return NextResponse.json(
            { error: "Informe o nome do combo." },
            { status: 400 }
          );
        }
        const pizzaSlots = Array.isArray(data.pizzaSlots)
          ? (data.pizzaSlots as ComboPizzaSlot[])
          : [
              {
                label: "Pizza Grande (8 fatias)",
                category: "salgada" as const,
                size: "G" as const,
                allowHalf: true,
              },
            ];
        const drinkSlots = Array.isArray(data.drinkSlots)
          ? (data.drinkSlots as ComboDrinkSlot[])
          : undefined;
        await upsertCombo({
          id: typeof data.id === "string" ? data.id : undefined,
          name,
          desc: String(data.desc || ""),
          price: parseNonNegNumber(data.price),
          originalPrice: parseNonNegNumber(
            data.originalPrice,
            parseNonNegNumber(data.price)
          ),
          image: typeof data.image === "string" ? data.image : undefined,
          items: Array.isArray(data.items) ? data.items.map(String) : [],
          pizzaSlots,
          drinkSlots,
          fixedDrinkLabel:
            typeof data.fixedDrinkLabel === "string"
              ? data.fixedDrinkLabel
              : undefined,
          available: data.available !== false,
        });
      } else if (resource === "crust") {
        const name = String(data.name || "").trim();
        if (name.length < 2) {
          return NextResponse.json(
            { error: "Informe o nome da borda." },
            { status: 400 }
          );
        }
        await upsertCrust({
          id: typeof data.id === "string" ? data.id : undefined,
          name,
          price: parseNonNegNumber(data.price),
          compatibleWith: parseCategories(data.compatibleWith),
          available: data.available !== false,
        });
      } else if (resource === "extra") {
        const name = String(data.name || "").trim();
        if (name.length < 2) {
          return NextResponse.json(
            { error: "Informe o nome do adicional." },
            { status: 400 }
          );
        }
        await upsertExtra({
          id: typeof data.id === "string" ? data.id : undefined,
          name,
          price: parseNonNegNumber(data.price),
          compatibleWith: parseCategories(data.compatibleWith),
          available: data.available !== false,
        });
      } else if (resource === "bairro") {
        const nome = String(data.nome || "").trim();
        if (nome.length < 2) {
          return NextResponse.json(
            { error: "Informe o nome do bairro." },
            { status: 400 }
          );
        }
        await upsertBairro({
          id: typeof data.id === "string" ? data.id : undefined,
          nome,
          frete: parseNonNegNumber(data.frete),
          active: data.active !== false,
        });
      } else {
        return NextResponse.json(
          { error: "Tipo de recurso inválido." },
          { status: 400 }
        );
      }

      const catalog = await getFullCatalog();
      return applyRefreshedCookies(
        NextResponse.json({ ok: true, catalog }),
        auth.refreshedTokens
      );
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar alterações no catálogo." },
      { status: 500 }
    );
  }
}
