"use client";

import { useState, useCallback } from "react";
import {
  printClosingReportViaBrowser,
  printClosingReportViaWebUsb,
  printOrderViaBrowser,
  printOrderViaWebUsb,
  requestEpsonUsbDevice,
  type ClosingReportData,
  type USBDevice,
} from "@/lib/escpos";
import type { DbOrder } from "@/types/supabase";

export function useAdminPrinter() {
  const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [printerError, setPrinterError] = useState<string | null>(null);

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

  const printOrder = useCallback(
    async (order: DbOrder) => {
      setPrinterError(null);
      if (usbDevice) {
        try {
          await printOrderViaWebUsb(usbDevice, order);
          return;
        } catch {
          // fallback automático para impressão do navegador
        }
      }
      printOrderViaBrowser(order);
    },
    [usbDevice]
  );

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
    autoPrint,
    setAutoPrint,
    printerError,
    connectUsbPrinter,
    printOrder,
    printClosingReport,
  };
}
