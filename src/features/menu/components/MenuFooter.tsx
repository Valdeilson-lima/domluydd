"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { DEFAULT_STORE_PROFILE, STORE_HOURS_LABEL } from "@/lib/store-config";
import type { StoreProfile } from "@/types/store";

interface MenuFooterProps {
  profile?: StoreProfile;
  hoursLabel?: string;
}

export function MenuFooter({
  profile = DEFAULT_STORE_PROFILE,
  hoursLabel = STORE_HOURS_LABEL,
}: MenuFooterProps) {
  return (
    <footer className="mt-16 border-t border-border bg-[#1c1512] px-4 py-12 text-[#f5ece0] sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
        <div className="space-y-3">
          <BrandMark subtitle="Pizzaria Delivery" size="md" inverted />
          <p className="text-sm text-[#c9bdb3]">
            {profile.ovenLabel} · {hoursLabel}
          </p>
        </div>

        <div className="space-y-1.5 text-sm">
          <p className="font-bold text-white">Balcão para retirada</p>
          <p className="text-[#c9bdb3]">{profile.pickupAddress}</p>
          <p>
            <a
              href={`https://wa.me/${profile.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-gold underline underline-offset-4 hover:text-white"
            >
              WhatsApp: {profile.whatsappDisplay}
            </a>
          </p>
          <p>
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#c9bdb3] underline underline-offset-4 hover:text-white"
            >
              Instagram {profile.instagramHandle}
            </a>
          </p>
        </div>

        <div className="space-y-3 text-sm sm:flex sm:flex-col sm:items-end sm:text-right">
          <InstallAppButton compact />
          <p>
            <Link
              href="/"
              className="font-semibold text-white underline underline-offset-4 hover:text-accent-gold"
            >
              Voltar para a página inicial
            </Link>
          </p>
          <p className="text-xs text-[#a99b90]">
            <a
              href="/credits.html"
              className="underline underline-offset-2 hover:text-white"
            >
              Créditos das fotografias
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
