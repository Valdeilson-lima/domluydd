"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  QrCode,
  Clock,
  Users,
  Save,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChefHat,
  Trash2,
  KeyRound,
  Printer,
  Usb,
  Unplug,
} from "lucide-react";
import type { USBDevice } from "@/lib/escpos";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  WEEKDAY_NAMES,
  WEEKDAY_ORDER,
} from "@/lib/store-config";
import { formatScheduleSummary } from "@/lib/utils";
import type {
  AdminRole,
  AdminUserProfile,
  DayKey,
  StoreMode,
  StoreProfile,
} from "@/types/store";

type SettingsTab = "store" | "pix" | "schedule" | "printer" | "team";

interface StoreSettingsManagerProps {
  userRole: AdminRole;
  profile: StoreProfile;
  isStoreOpen: boolean;
  storeMode: StoreMode;
  customMessage: string | null;
  isAutoOpen: boolean;
  hoursShort: string;
  currentUserId: string;
  usbDevice: USBDevice | null;
  webUsbSupported: boolean;
  autoPrint: boolean;
  printerError: string | null;
  onToggleAutoPrint: () => void;
  onConnectUsb: () => Promise<void>;
  onDisconnectUsb: () => Promise<void>;
  onPrintTest: () => Promise<void>;
  onSaveStoreStatus: (
    mode: StoreMode,
    customMessage: string | null
  ) => Promise<boolean>;
  onSaveProfile: (
    patch: Partial<StoreProfile>
  ) => Promise<{ ok: boolean; error?: string }>;
  onUnauthorized: () => void;
}

const PIX_KEY_TYPES = ["Telefone", "CPF", "CNPJ", "E-mail", "Chave aleatória"];

export function StoreSettingsManager({
  userRole,
  profile,
  isStoreOpen,
  storeMode,
  customMessage,
  isAutoOpen,
  hoursShort,
  currentUserId,
  usbDevice,
  webUsbSupported,
  autoPrint,
  printerError,
  onToggleAutoPrint,
  onConnectUsb,
  onDisconnectUsb,
  onPrintTest,
  onSaveStoreStatus,
  onSaveProfile,
  onUnauthorized,
}: StoreSettingsManagerProps) {
  const isOwner = userRole === "owner";
  const [tab, setTab] = useState<SettingsTab>(isOwner ? "store" : "printer");
  const [draft, setDraft] = useState<StoreProfile>(profile);
  const [modeDraft, setModeDraft] = useState<StoreMode>(storeMode);
  const [messageDraft, setMessageDraft] = useState(customMessage ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [newCommonRemoval, setNewCommonRemoval] = useState("");
  const [newSweetRemoval, setNewSweetRemoval] = useState("");

  // Equipe
  const [team, setTeam] = useState<AdminUserProfile[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<AdminRole>("kitchen");
  const [teamBusy, setTeamBusy] = useState(false);
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [resetPwValue, setResetPwValue] = useState("");

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    setModeDraft(storeMode);
    setMessageDraft(customMessage ?? "");
  }, [storeMode, customMessage]);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.users)) {
        setTeam(data.users as AdminUserProfile[]);
      }
    } finally {
      setTeamLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    if (!isOwner && tab !== "printer") {
      setTab("printer");
    }
  }, [isOwner, tab]);

  useEffect(() => {
    if (isOwner && tab === "team") {
      loadTeam();
    }
  }, [isOwner, tab, loadTeam]);

  const showSuccess = (text: string) => {
    setFeedback({ type: "success", text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStatus(true);
    setFeedback(null);
    try {
      const ok = await onSaveStoreStatus(
        modeDraft,
        messageDraft.trim() || null
      );
      if (!ok) {
        setFeedback({
          type: "error",
          text: "Não foi possível atualizar o status da loja.",
        });
        return;
      }
      showSuccess("Status de funcionamento da loja atualizado!");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const result = await onSaveProfile(draft);
      if (!result.ok) {
        setFeedback({
          type: "error",
          text: result.error || "Erro ao salvar configurações.",
        });
        return;
      }
      showSuccess("Configurações salvas no Supabase e aplicadas na loja!");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (
    key: DayKey,
    patch: Partial<{ enabled: boolean; open: string; close: string }>
  ) => {
    setDraft((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [key]: { ...prev.schedule[key], ...patch },
      },
    }));
  };

  const addRemoval = (kind: "common" | "sweet") => {
    const raw = (kind === "common" ? newCommonRemoval : newSweetRemoval).trim();
    if (!raw) return;
    if (kind === "common") {
      if (!draft.commonRemovals.includes(raw)) {
        setDraft((prev) => ({
          ...prev,
          commonRemovals: [...prev.commonRemovals, raw],
        }));
      }
      setNewCommonRemoval("");
    } else {
      if (!draft.sweetRemovals.includes(raw)) {
        setDraft((prev) => ({
          ...prev,
          sweetRemovals: [...prev.sweetRemovals, raw],
        }));
      }
      setNewSweetRemoval("");
    }
  };

  const removeRemoval = (kind: "common" | "sweet", label: string) => {
    if (kind === "common") {
      setDraft((prev) => ({
        ...prev,
        commonRemovals: prev.commonRemovals.filter((r) => r !== label),
      }));
    } else {
      setDraft((prev) => ({
        ...prev,
        sweetRemovals: prev.sweetRemovals.filter((r) => r !== label),
      }));
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setTeamBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newMemberName.trim(),
          email: newMemberEmail.trim(),
          password: newMemberPassword,
          role: newMemberRole,
        }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data?.error || "Não foi possível criar o usuário.",
        });
        return;
      }
      if (Array.isArray(data?.users)) setTeam(data.users);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPassword("");
      setNewMemberRole("kitchen");
      showSuccess("Acesso criado! O usuário já pode entrar em /admin.");
    } finally {
      setTeamBusy(false);
    }
  };

  const handlePatchMember = async (
    id: string,
    patch: { role?: AdminRole; active?: boolean; password?: string }
  ) => {
    setFeedback(null);
    setTeamBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data?.error || "Não foi possível atualizar o usuário.",
        });
        return;
      }
      if (Array.isArray(data?.users)) setTeam(data.users);
      if (patch.password) {
        setResetPwUserId(null);
        setResetPwValue("");
        showSuccess("Senha do usuário atualizada com sucesso!");
      } else {
        showSuccess("Permissões atualizadas!");
      }
    } finally {
      setTeamBusy(false);
    }
  };

  const handleDeleteMember = async (member: AdminUserProfile) => {
    if (
      !window.confirm(
        `Remover o acesso de ${member.fullName || member.email} (${member.email}) permanentemente?`
      )
    ) {
      return;
    }
    setFeedback(null);
    setTeamBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data?.error || "Não foi possível remover o usuário.",
        });
        return;
      }
      if (Array.isArray(data?.users)) setTeam(data.users);
      showSuccess("Usuário removido.");
    } finally {
      setTeamBusy(false);
    }
  };

  const schedulePreview = formatScheduleSummary(draft.schedule);

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Store }> =
    isOwner
      ? [
          { id: "store", label: "Loja & Contato", icon: Store },
          { id: "pix", label: "Pagamento PIX", icon: QrCode },
          { id: "schedule", label: "Horários & Retiradas", icon: Clock },
          { id: "printer", label: "Impressora USB", icon: Printer },
          { id: "team", label: "Equipe & Acessos", icon: Users },
        ]
      : [{ id: "printer", label: "Impressora USB", icon: Printer }];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <div>
          <h1 className="font-serif text-2xl font-extrabold text-foreground">
            {isOwner ? "Configurações da Pizzaria" : "Impressora Térmica"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isOwner
              ? "Dados salvos no Supabase (`store_settings`), controle de impressora USB e acessos da equipe."
              : "Conecte a impressora térmica 80mm neste computador e configure a impressão automática de comandas."}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Seções de configuração"
          className="flex flex-wrap items-center gap-1.5"
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.id);
                  setFeedback(null);
                }}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-status-open/30 bg-status-open/10 text-status-open"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ==================== TAB LOJA & CONTATO ==================== */}
      {tab === "store" && isOwner && (
        <div className="space-y-5">
          <form
            onSubmit={handleSaveStatus}
            className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Funcionamento da loja (Aberta / Fechada)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Horário automático atual:{" "}
                  <strong className="text-foreground">
                    {isAutoOpen ? "Dentro do expediente" : "Fora do expediente"}
                  </strong>
                  .
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isStoreOpen
                    ? "bg-status-open/10 text-status-open"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    isStoreOpen ? "bg-status-open" : "bg-primary"
                  }`}
                  aria-hidden="true"
                />
                {isStoreOpen ? "Loja aberta agora" : "Loja fechada agora"}
              </span>
            </div>

            <div className="grid gap-2.5 md:grid-cols-3">
              {(
                [
                  {
                    value: "auto" as StoreMode,
                    title: `Automático (${hoursShort})`,
                    desc: "Abre e fecha conforme a grade semanal.",
                  },
                  {
                    value: "open" as StoreMode,
                    title: "Forçar Loja Aberta",
                    desc: "Aceita pedidos mesmo fora do horário.",
                  },
                  {
                    value: "closed" as StoreMode,
                    title: "Forçar Loja Fechada",
                    desc: "Pausa novos pedidos imediatamente.",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`block cursor-pointer rounded-xl border p-3.5 transition-colors ${
                    modeDraft === opt.value
                      ? "border-primary bg-primary/8"
                      : "border-border bg-background hover:bg-secondary/60"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <input
                      type="radio"
                      name="store-mode-settings"
                      value={opt.value}
                      checked={modeDraft === opt.value}
                      onChange={() => setModeDraft(opt.value)}
                      className="accent-primary"
                    />
                    {opt.title}
                  </span>
                  <span className="mt-1 block pl-5 text-[11px] text-muted-foreground">
                    {opt.desc}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1 space-y-1">
                <label
                  htmlFor="cfg-store-custom-message"
                  className="block text-xs font-bold text-foreground"
                >
                  Aviso personalizado ao cliente (opcional)
                </label>
                <input
                  id="cfg-store-custom-message"
                  type="text"
                  maxLength={180}
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Ex.: Voltamos amanhã às 18h ou Tempo maior por chuva…"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={savingStatus}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
              >
                <Store className="size-4" aria-hidden="true" />
                {savingStatus ? "Aplicando…" : "Aplicar status"}
              </button>
            </div>
          </form>

          <form
            onSubmit={handleSaveSettings}
            className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6"
          >
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Identidade, endereço e contatos
              </h2>
              <p className="text-xs text-muted-foreground">
                Informações exibidas na vitrine, rodapé, checkout e comandas.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="cfg-store-name"
                  className="block text-xs font-bold text-foreground"
                >
                  Nome da pizzaria
                </label>
                <input
                  id="cfg-store-name"
                  type="text"
                  value={draft.storeName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, storeName: e.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-oven-label"
                  className="block text-xs font-bold text-foreground"
                >
                  Tipo de forno (exibido na vitrine e rodapé)
                </label>
                <input
                  id="cfg-oven-label"
                  type="text"
                  value={draft.ovenLabel}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, ovenLabel: e.target.value }))
                  }
                  placeholder="Ex.: Forno elétrico"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label
                  htmlFor="cfg-pickup-address"
                  className="block text-xs font-bold text-foreground"
                >
                  Endereço completo do balcão (retirada e rodapé)
                </label>
                <input
                  id="cfg-pickup-address"
                  type="text"
                  value={draft.pickupAddress}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, pickupAddress: e.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-street-district"
                  className="block text-xs font-bold text-foreground"
                >
                  Rua e bairro (título na página inicial)
                </label>
                <input
                  id="cfg-street-district"
                  type="text"
                  value={draft.streetDistrict}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, streetDistrict: e.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-city"
                  className="block text-xs font-bold text-foreground"
                >
                  Cidade
                </label>
                <input
                  id="cfg-city"
                  type="text"
                  value={draft.city}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, city: e.target.value }))
                  }
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-whatsapp-num"
                  className="block text-xs font-bold text-foreground"
                >
                  WhatsApp (somente dígitos com DDI 55)
                </label>
                <input
                  id="cfg-whatsapp-num"
                  type="text"
                  inputMode="numeric"
                  value={draft.whatsappNumber}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      whatsappNumber: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="5583993740352"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-whatsapp-display"
                  className="block text-xs font-bold text-foreground"
                >
                  WhatsApp formatado (exibição)
                </label>
                <input
                  id="cfg-whatsapp-display"
                  type="text"
                  value={draft.whatsappDisplay}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, whatsappDisplay: e.target.value }))
                  }
                  placeholder="(83) 99374-0352"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-ig-handle"
                  className="block text-xs font-bold text-foreground"
                >
                  Instagram (@perfil)
                </label>
                <input
                  id="cfg-ig-handle"
                  type="text"
                  value={draft.instagramHandle}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, instagramHandle: e.target.value }))
                  }
                  placeholder="@pizzariadonluydd"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-ig-url"
                  className="block text-xs font-bold text-foreground"
                >
                  Link do Instagram
                </label>
                <input
                  id="cfg-ig-url"
                  type="url"
                  value={draft.instagramUrl}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, instagramUrl: e.target.value }))
                  }
                  placeholder="https://www.instagram.com/pizzariadonluydd/"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-eta-delivery"
                  className="block text-xs font-bold text-foreground"
                >
                  Tempo médio de entrega
                </label>
                <input
                  id="cfg-eta-delivery"
                  type="text"
                  value={draft.estimatedDelivery}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      estimatedDelivery: e.target.value,
                    }))
                  }
                  placeholder="35–50 min"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cfg-eta-pickup"
                  className="block text-xs font-bold text-foreground"
                >
                  Tempo médio de retirada no balcão
                </label>
                <input
                  id="cfg-eta-pickup"
                  type="text"
                  value={draft.estimatedPickup}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, estimatedPickup: e.target.value }))
                  }
                  placeholder="20–30 min"
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
              >
                <Save className="size-4" aria-hidden="true" />
                {saving ? "Salvando…" : "Salvar dados da loja"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB PIX ==================== */}
      {tab === "pix" && isOwner && (
        <form
          onSubmit={handleSaveSettings}
          className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="cfg-pix-type"
                className="block text-xs font-bold text-foreground"
              >
                Tipo da chave PIX
              </label>
              <select
                id="cfg-pix-type"
                value={draft.pixKeyType}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pixKeyType: e.target.value }))
                }
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              >
                {PIX_KEY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cfg-pix-recipient"
                className="block text-xs font-bold text-foreground"
              >
                Favorecido / Titular
              </label>
              <input
                id="cfg-pix-recipient"
                type="text"
                value={draft.pixRecipient}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pixRecipient: e.target.value }))
                }
                placeholder="Don Luydd Pizzaria"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cfg-pix-key"
                className="block text-xs font-bold text-foreground"
              >
                Chave PIX exata (copiada pelo cliente)
              </label>
              <input
                id="cfg-pix-key"
                type="text"
                value={draft.pixKey}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pixKey: e.target.value }))
                }
                placeholder="83993740352"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cfg-pix-display"
                className="block text-xs font-bold text-foreground"
              >
                Chave PIX formatada (exibida no checkout)
              </label>
              <input
                id="cfg-pix-display"
                type="text"
                value={draft.pixKeyDisplay}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pixKeyDisplay: e.target.value }))
                }
                placeholder="(83) 99374-0352"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/50 p-4 text-xs">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Prévia no checkout do cliente
            </p>
            <p className="font-bold text-foreground">
              Chave PIX ({draft.pixKeyType})
            </p>
            <p className="font-mono text-foreground">{draft.pixKeyDisplay}</p>
            {draft.pixRecipient && (
              <p className="text-muted-foreground">
                Favorecido: {draft.pixRecipient}
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
            >
              <Save className="size-4" aria-hidden="true" />
              {saving ? "Salvando…" : "Salvar chave PIX"}
            </button>
          </div>
        </form>
      )}

      {/* ==================== TAB HORÁRIOS & RETIRADAS ==================== */}
      {tab === "schedule" && isOwner && (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Grade semanal automática
                </h2>
                <p className="text-xs text-muted-foreground">
                  Resumo exibido ao cliente:{" "}
                  <strong className="text-foreground">
                    {schedulePreview.full}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    schedule: { ...DEFAULT_WEEKLY_SCHEDULE },
                  }))
                }
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary"
              >
                Restaurar Ter–Dom (18h–22h)
              </button>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-background">
              {WEEKDAY_ORDER.map((dayKey) => {
                const slot = draft.schedule[dayKey];
                return (
                  <div
                    key={dayKey}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <label className="flex min-w-[160px] cursor-pointer items-center gap-2.5 text-sm font-bold text-foreground">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) =>
                          updateDay(dayKey, { enabled: e.target.checked })
                        }
                        className="size-4 accent-primary"
                      />
                      <span>{WEEKDAY_NAMES[dayKey].full}</span>
                    </label>

                    {slot.enabled ? (
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="time"
                          aria-label={`Abertura ${WEEKDAY_NAMES[dayKey].full}`}
                          value={slot.open}
                          onChange={(e) =>
                            updateDay(dayKey, { open: e.target.value })
                          }
                          className="min-h-10 rounded-lg border border-input bg-card px-2.5 font-mono text-sm text-foreground"
                        />
                        <span className="font-semibold text-muted-foreground">
                          às
                        </span>
                        <input
                          type="time"
                          aria-label={`Fechamento ${WEEKDAY_NAMES[dayKey].full}`}
                          value={slot.close}
                          onChange={(e) =>
                            updateDay(dayKey, { close: e.target.value })
                          }
                          className="min-h-10 rounded-lg border border-input bg-card px-2.5 font-mono text-sm text-foreground"
                        />
                      </div>
                    ) : (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                        Fechado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Retiradas salgadas */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <div>
                <h2 className="font-serif text-lg font-bold text-foreground">
                  Retirar ingredientes (Salgadas)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Chips rápidos exibidos ao montar pizzas salgadas.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommonRemoval}
                  onChange={(e) => setNewCommonRemoval(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRemoval("common");
                    }
                  }}
                  placeholder="Ex.: Sem Pimentão"
                  className="min-h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => addRemoval("common")}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border bg-secondary px-3 text-xs font-bold text-foreground hover:border-primary/40"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.commonRemovals.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeRemoval("common", item)}
                      aria-label={`Remover ${item}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Retiradas doces */}
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <div>
                <h2 className="font-serif text-lg font-bold text-foreground">
                  Retirar ingredientes (Doces)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Chips rápidos exibidos ao montar pizzas doces.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSweetRemoval}
                  onChange={(e) => setNewSweetRemoval(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRemoval("sweet");
                    }
                  }}
                  placeholder="Ex.: Sem Coco Ralado"
                  className="min-h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => addRemoval("sweet")}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border bg-secondary px-3 text-xs font-bold text-foreground hover:border-primary/40"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draft.sweetRemovals.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeRemoval("sweet", item)}
                      aria-label={`Remover ${item}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
            >
              <Save className="size-4" aria-hidden="true" />
              {saving ? "Salvando…" : "Salvar horários e retiradas"}
            </button>
          </div>
        </form>
      )}

      {/* ==================== TAB IMPRESSORA USB ==================== */}
      {tab === "printer" && (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Conexão direta WebUSB (ESC/POS 80mm)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Compatível com Epson TM-T20 e impressoras térmicas ESC/POS via
                  Google Chrome ou Microsoft Edge.
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  usbDevice
                    ? "bg-status-open/10 text-status-open"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    usbDevice ? "bg-status-open" : "bg-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
                {usbDevice ? "USB conectada" : "Modo navegador"}
              </span>
            </div>

            {usbDevice ? (
              <div className="rounded-xl border border-status-open/30 bg-status-open/5 p-4 text-xs">
                <p className="font-bold text-foreground">
                  Dispositivo conectado:
                </p>
                <p className="mt-0.5 font-mono text-foreground">
                  {usbDevice.productName || "Impressora Térmica USB"}{" "}
                  {usbDevice.manufacturerName
                    ? `(${usbDevice.manufacturerName})`
                    : ""}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
                Nenhuma impressora USB pareada nesta aba. Enquanto não houver
                conexão WebUSB, os botões de impressão usam a janela de
                impressão 80mm do navegador automaticamente.
              </div>
            )}

            {!webUsbSupported && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-accent-gold/50 bg-accent-gold-soft px-4 py-3 text-xs font-semibold text-accent-gold-ink"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  Este navegador não suporta WebUSB. Use Google Chrome ou
                  Microsoft Edge no computador do caixa, ou utilize a impressão
                  padrão do navegador.
                </span>
              </div>
            )}

            {printerError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{printerError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={!webUsbSupported}
                onClick={onConnectUsb}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-45"
              >
                <Usb className="size-4" aria-hidden="true" />
                {usbDevice
                  ? "Trocar impressora USB"
                  : "Conectar impressora USB"}
              </button>

              {usbDevice && (
                <button
                  type="button"
                  onClick={onDisconnectUsb}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground hover:border-destructive/40 hover:text-destructive"
                >
                  <Unplug className="size-4" aria-hidden="true" />
                  Desconectar
                </button>
              )}

              <button
                type="button"
                onClick={onPrintTest}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground hover:border-primary/40 hover:bg-secondary"
              >
                <Printer className="size-4" aria-hidden="true" />
                Imprimir comanda de teste
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">
                    Auto-impressão de pedidos
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Imprime a comanda automaticamente assim que um novo pedido
                    entrar na fila deste aparelho.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoPrint}
                  onClick={onToggleAutoPrint}
                  className={`inline-flex min-h-10 shrink-0 items-center rounded-xl border px-3.5 text-xs font-extrabold transition-colors ${
                    autoPrint
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {autoPrint ? "ATIVADA" : "DESATIVADA"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Esta preferência fica salva apenas neste computador/tablet da
                cozinha.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cabeçalho atual da comanda (80mm)
              </p>
              <div className="rounded-xl border border-dashed border-border bg-background p-3.5 text-center font-mono text-xs text-foreground">
                <p className="font-bold">{profile.storeName.toUpperCase()}</p>
                <p className="text-[11px] text-muted-foreground">
                  {profile.ovenLabel}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  WhatsApp: {profile.whatsappDisplay}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dica: se usar impressão via navegador no caixa, abra o Chrome
                com <code className="font-mono">--kiosk-printing</code> para
                imprimir sem abrir o diálogo de confirmação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB EQUIPE & ACESSOS ==================== */}
      {tab === "team" && isOwner && (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-2xs lg:col-span-7">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Acessos cadastrados ({team.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                <strong>Dono</strong> tem acesso total (Loja Aberta/Fechada,
                Caixa, Produtos, PIX, Equipe). <strong>Cozinha</strong> vê
                apenas Pedidos, Forno, Impressora e Estoque.
              </p>
            </div>

            {teamLoading && team.length === 0 ? (
              <p className="py-6 text-xs text-muted-foreground">
                Carregando equipe…
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-background">
                {team.map((member) => {
                  const isSelf = member.id === currentUserId;
                  const resetting = resetPwUserId === member.id;
                  return (
                    <li key={member.id} className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground">
                              {member.fullName || member.email}
                            </span>
                            {isSelf && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                Você
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                member.role === "owner"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-accent-gold-soft text-accent-gold-ink"
                              }`}
                            >
                              {member.role === "owner" ? (
                                <ShieldCheck
                                  className="size-3"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ChefHat
                                  className="size-3"
                                  aria-hidden="true"
                                />
                              )}
                              {member.role === "owner" ? "Dono" : "Cozinha"}
                            </span>
                            {!member.active && (
                              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                                Desativado
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <select
                            aria-label={`Perfil de ${member.email}`}
                            disabled={teamBusy}
                            value={member.role}
                            onChange={(e) =>
                              handlePatchMember(member.id, {
                                role: e.target.value as AdminRole,
                              })
                            }
                            className="min-h-9 rounded-lg border border-input bg-card px-2 text-xs font-bold text-foreground"
                          >
                            <option value="owner">Dono</option>
                            <option value="kitchen">Cozinha</option>
                          </select>

                          <button
                            type="button"
                            disabled={teamBusy}
                            onClick={() =>
                              handlePatchMember(member.id, {
                                active: !member.active,
                              })
                            }
                            className={`min-h-9 rounded-lg border px-2.5 text-xs font-bold transition-colors ${
                              member.active
                                ? "border-border bg-card text-foreground hover:bg-secondary"
                                : "border-status-open/40 bg-status-open/10 text-status-open"
                            }`}
                          >
                            {member.active ? "Desativar" : "Reativar"}
                          </button>

                          <button
                            type="button"
                            disabled={teamBusy}
                            onClick={() => {
                              setResetPwUserId(resetting ? null : member.id);
                              setResetPwValue("");
                            }}
                            title="Definir nova senha"
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                          >
                            <KeyRound className="size-3.5" aria-hidden="true" />
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              disabled={teamBusy}
                              onClick={() => handleDeleteMember(member)}
                              title="Excluir usuário"
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {resetting && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                          <input
                            type="password"
                            value={resetPwValue}
                            onChange={(e) => setResetPwValue(e.target.value)}
                            placeholder="Nova senha (mín. 8 caracteres)"
                            className="min-h-9 flex-1 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                          />
                          <button
                            type="button"
                            disabled={teamBusy || resetPwValue.length < 8}
                            onClick={() =>
                              handlePatchMember(member.id, {
                                password: resetPwValue,
                              })
                            }
                            className="min-h-9 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
                          >
                            Atualizar senha
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleCreateMember}
            className="space-y-4 self-start rounded-2xl border border-border bg-card p-5 shadow-2xs lg:col-span-5"
          >
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Adicionar membro da equipe
              </h2>
              <p className="text-xs text-muted-foreground">
                Cria o login no Supabase Auth imediatamente (sem precisar
                confirmar e-mail).
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="team-name"
                className="block text-xs font-bold text-foreground"
              >
                Nome
              </label>
              <input
                id="team-name"
                type="text"
                required
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Ex.: Carlos (Forno)"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="team-email"
                className="block text-xs font-bold text-foreground"
              >
                E-mail de acesso
              </label>
              <input
                id="team-email"
                type="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="cozinha@donluydd.com.br"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="team-password"
                className="block text-xs font-bold text-foreground"
              >
                Senha inicial (mín. 8 caracteres)
              </label>
              <input
                id="team-password"
                type="password"
                required
                minLength={8}
                value={newMemberPassword}
                onChange={(e) => setNewMemberPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="team-role"
                className="block text-xs font-bold text-foreground"
              >
                Nível de permissão
              </label>
              <select
                id="team-role"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as AdminRole)}
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="kitchen">
                  Cozinha (Pedidos, Forno, Impressão e Estoque)
                </option>
                <option value="owner">
                  Dono (Acesso total: Caixa, Produtos, PIX e Equipe)
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={teamBusy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {teamBusy ? "Criando acesso…" : "Criar acesso"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
