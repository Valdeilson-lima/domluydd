import { NextRequest, NextResponse } from "next/server";
import { applyRefreshedCookies, requireAdminSession } from "@/lib/admin-auth";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminRole, AdminUserProfile } from "@/types/store";

function mapRow(row: Record<string, unknown>): AdminUserProfile {
  return {
    id: String(row.id),
    email: String(row.email || ""),
    fullName: String(row.full_name || ""),
    role: row.role === "owner" ? "owner" : "kitchen",
    active: row.active !== false,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

async function listAllAdminUsers(): Promise<AdminUserProfile[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !Array.isArray(data)) return [];
  return data.map((r) => mapRow(r as Record<string, unknown>));
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const users = await listAllAdminUsers();
  return applyRefreshedCookies(
    NextResponse.json({ users }),
    auth.refreshedTokens
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!supabaseAdmin || !hasServiceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ausente no servidor." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const fullName =
      typeof body?.fullName === "string"
        ? body.fullName.trim().slice(0, 80)
        : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role: AdminRole = body?.role === "owner" ? "owner" : "kitchen";

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: "Informe o nome do usuário." },
        { status: 400 }
      );
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha inicial deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (created.error || !created.data.user) {
      return NextResponse.json(
        {
          error:
            created.error?.message ||
            "Não foi possível criar o usuário (verifique se o e-mail já está em uso).",
        },
        { status: 400 }
      );
    }

    const { error: insertErr } = await supabaseAdmin
      .from("admin_users")
      .insert({
        id: created.data.user.id,
        email,
        full_name: fullName,
        role,
        active: true,
        updated_at: new Date().toISOString(),
      });

    if (insertErr) {
      await supabaseAdmin.auth.admin
        .deleteUser(created.data.user.id)
        .catch(() => {});
      return NextResponse.json(
        { error: `Falha ao salvar perfil: ${insertErr.message}` },
        { status: 500 }
      );
    }

    const users = await listAllAdminUsers();
    return applyRefreshedCookies(
      NextResponse.json({ ok: true, users }, { status: 201 }),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar membro da equipe." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!supabaseAdmin || !hasServiceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ausente no servidor." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    const usersBefore = await listAllAdminUsers();
    const target = usersBefore.find((u) => u.id === id);
    if (!target) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const nextRole: AdminRole =
      body?.role === "owner" || body?.role === "kitchen"
        ? body.role
        : target.role;
    const nextActive =
      typeof body?.active === "boolean" ? body.active : target.active;
    const nextName =
      typeof body?.fullName === "string" && body.fullName.trim().length >= 2
        ? body.fullName.trim().slice(0, 80)
        : target.fullName;
    const newPassword =
      typeof body?.password === "string" && body.password.trim()
        ? body.password.trim()
        : null;

    if (newPassword && newPassword.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    const activeOwnersAfter = usersBefore.filter((u) => {
      const role = u.id === id ? nextRole : u.role;
      const active = u.id === id ? nextActive : u.active;
      return role === "owner" && active;
    }).length;

    if (activeOwnersAfter === 0) {
      return NextResponse.json(
        {
          error:
            "É obrigatório manter pelo menos 1 Dono ativo para não perder o acesso administrativo.",
        },
        { status: 400 }
      );
    }

    if (newPassword) {
      const pwRes = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: newPassword,
      });
      if (pwRes.error) {
        return NextResponse.json(
          { error: `Erro ao atualizar senha: ${pwRes.error.message}` },
          { status: 400 }
        );
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("admin_users")
      .update({
        full_name: nextName,
        role: nextRole,
        active: nextActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { error: `Erro ao atualizar usuário: ${updateErr.message}` },
        { status: 500 }
      );
    }

    const users = await listAllAdminUsers();
    return applyRefreshedCookies(
      NextResponse.json({ ok: true, users }),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar membro da equipe." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!supabaseAdmin || !hasServiceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ausente no servidor." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    if (id === auth.session.userId) {
      return NextResponse.json(
        {
          error:
            "Você não pode excluir sua própria conta enquanto está logado.",
        },
        { status: 400 }
      );
    }

    const usersBefore = await listAllAdminUsers();
    const remainingOwners = usersBefore.filter(
      (u) => u.id !== id && u.role === "owner" && u.active
    ).length;

    if (remainingOwners === 0) {
      return NextResponse.json(
        { error: "É obrigatório manter pelo menos 1 Dono ativo." },
        { status: 400 }
      );
    }

    const delRes = await supabaseAdmin.auth.admin.deleteUser(id);
    if (delRes.error) {
      return NextResponse.json(
        { error: `Erro ao remover usuário: ${delRes.error.message}` },
        { status: 500 }
      );
    }

    // Garantia adicional caso a linha ainda exista
    await supabaseAdmin.from("admin_users").delete().eq("id", id);

    const users = await listAllAdminUsers();
    return applyRefreshedCookies(
      NextResponse.json({ ok: true, users }),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao remover membro da equipe." },
      { status: 500 }
    );
  }
}
