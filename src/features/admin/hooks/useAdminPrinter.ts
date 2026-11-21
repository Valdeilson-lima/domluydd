"use client";

import { useState, useCallback, useEffect } from "react";
import {
  isWebUsbSupported,
  printClosingReportViaBrowser,
  printClosingReportViaWebUsb,
  printOrderViaBrowser,
  printOrderViaWebUsb,
  requestEpsonUsbDevice,
  type ClosingReportData,
  type ReceiptStoreHeader,
  type USBDevice,
} from "@/lib/escpos";
import type { DbOrder } from "@/types/supabase";

const AUTOPRINT_STORAGE_KEY = "donluydd_admin_autoprint";

export function useAdminPrinter(storeHeader?: ReceiptStoreHeader) {
  const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
  const [autoPrint, setAutoPrintState] = useState(false);
  const [printerError, setPrinterError] = useState<string | null>(null);
  const [webUsbSupported, setWebUsbSupported] = useState(true);

  useEffect(() => {
    setWebUsbSupported(isWebUsbSupported());
    try {
      const saved = window.localStorage.getItem(AUTOPRINT_STORAGE_KEY);
      if (saved === "1") setAutoPrintState(true);
    } catch {
      // ignore storage restrictions
    }
  }, []);

  const setAutoPrint = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setAutoPrintState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          window.localStorage.setItem(
            AUTOPRINT_STORAGE_KEY,
            resolved ? "1" : "0"
          );
        } catch {
          // ignore
        }
        return resolved;
      });
    },
    []
  );

  const connectUsbPrinter = useCallback(async () => {
    setPrinterError(null);
    try {
      const device = await requestEpsonUsbDevice();
      setUsbDevice(device);
    } catch (err) {
      setPrinterError(
        err instanceof Error
          ? err.message
          : "Não foi possível conectar à impressora USB."
      );
    }
  }, []);

  const disconnectUsbPrinter = useCallback(async () => {
    setPrinterError(null);
    if (usbDevice) {
      try {
        if (usbDevice.opened) {
          await usbDevice.close();
        }
      } catch {
        // ignore close errors
      }
      setUsbDevice(null);
    }
  }, [usbDevice]);

  const printOrder = useCallback(
    async (order: DbOrder) => {
      setPrinterError(null);
      if (usbDevice) {
        try {
          await printOrderViaWebUsb(usbDevice, order, storeHeader);
          return;
        } catch {
          // fallback automático para impressão do navegador
        }
      }
      printOrderViaBrowser(order, storeHeader);
    },
    [usbDevice, storeHeader]
  );

  const printTestOrder = useCallback(async () => {
    const sampleOrder: DbOrder = {
      id: "TESTE001-0000-0000-0000-000000000000",
      created_at: new Date().toISOString(),
      customer_name: "Teste de Impressão",
      customer_phone: "(83) 99999-0000",
      delivery_type: "takeaway",
      address: null,
      bairro: null,
      cep: null,
      complement: null,
      items: [
        {
          id: 1,
          category: "salgada",
          size: "G",
          qty: 1,
          price: 48,
          flavors: [
            { name: "Calabresa", price: 40 },
            { name: "4 Queijos", price: 45 },
          ],
          crust: { name: "Borda de Catupiry Original", price: 8 },
          removals: ["Sem Cebola"],
          observation: "Comanda de teste térmico 80mm",
        },
      ],
      subtotal: 48,
      delivery_fee: 0,
      total: 48,
      payment_method: "Pix",
      change_for: null,
      status: "pending",
      notes: null,
      whatsapp_notifications: false,
    };
    await printOrder(sampleOrder);
  }, [printOrder]);

  const printClosingReport = useCallback(
    async (report: ClosingReportData) => {
      setPrinterError(null);
      if (usbDevice) {
        try {
          await printClosingReportViaWebUsb(usbDevice, report);
          return;
        } catch {
          // fallback para impressão HTML
        }
      }
      printClosingReportViaBrowser(report);
    },
    [usbDevice]
  );

  return {
    usbDevice,
    webUsbSupported,
    autoPrint,
    setAutoPrint,
    printerError,
    connectUsbPrinter,
    disconnectUsbPrinter,
    printOrder,
    printTestOrder,
    printClosingReport,
  };
}
