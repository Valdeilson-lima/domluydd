import type { DbOrder } from "@/types/supabase";
import { formatPrice } from "@/lib/utils";

// Tipagem WebUSB para navegadores baseados em Chromium
export interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
}

export interface USBAlternateInterface {
  endpoints: USBEndpoint[];
}

export interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
}

export interface USBConfiguration {
  interfaces: USBInterface[];
}

export interface USBDevice {
  opened: boolean;
  productName?: string;
  manufacturerName?: string;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(
    endpointNumber: number,
    data: Uint8Array | BufferSource
  ): Promise<{ bytesWritten: number; status: string }>;
  configuration?: USBConfiguration;
}

interface NavigatorWithUsb extends Navigator {
  usb?: {
    requestDevice(options: {
      filters: Array<{ vendorId?: number; productId?: number }>;
    }): Promise<USBDevice>;
    getDevices(): Promise<USBDevice[]>;
  };
}

// Comandos ESC/POS Padrão Epson TM-T20
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: [ESC, 0x40], // Inicializa impressora
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_ON: [GS, 0x21, 0x11], // Altura e largura duplas
  DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  NORMAL_TEXT: [GS, 0x21, 0x00],
  FEED_3: [ESC, 0x64, 0x03], // Avança 3 linhas
  FEED_5: [ESC, 0x64, 0x05], // Avança 5 linhas
  PARTIAL_CUT: [GS, 0x56, 0x42, 0x20], // Avança e corta papel com guilhotina
  BEEP: [ESC, 0x42, 0x02, 0x02], // Beep sonoro (2 bipes)
};

// Remove acentos para compatibilidade com tabela de caracteres ASCII padrão da TM-T20
export function cleanText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^ -~\n]/g, "");
}

// Formata linha com texto à esquerda e valor à direita (48 colunas padrão 80mm)
export function justifyLine(left: string, right: string, width = 48): string {
  const l = cleanText(left);
  const r = cleanText(right);
  const spaces = Math.max(1, width - l.length - r.length);
  return l + " ".repeat(spaces) + r;
}

// Monta o buffer de bytes ESC/POS para a Epson TM-T20
export function buildEpsonEscPos(order: DbOrder): Uint8Array {
  const bytes: number[] = [];

  const addBytes = (...arr: number[]) => {
    bytes.push(...arr);
  };

  const addString = (str: string) => {
    const cleaned = cleanText(str);
    for (let i = 0; i < cleaned.length; i++) {
      bytes.push(cleaned.charCodeAt(i));
    }
  };

  const addLine = (str = "") => {
    addString(str);
    bytes.push(0x0a); // LF (\n)
  };

  // Inicialização e som de alerta
  addBytes(...CMD.INIT);
  addBytes(...CMD.BEEP);

  // Cabeçalho da Pizzaria
  addBytes(...CMD.ALIGN_CENTER);
  addBytes(...CMD.DOUBLE_ON);
  addLine("DON LUYDD PIZZARIA");
  addBytes(...CMD.NORMAL_TEXT);
  addLine("Pizzas Artesanais - Forno a Lenha");
  addLine("WhatsApp: (83) 99374-0352");
  addLine("=".repeat(48));

  // Dados do Pedido
  addBytes(...CMD.ALIGN_LEFT);
  addBytes(...CMD.BOLD_ON);
  addLine(`PEDIDO #${order.id.slice(0, 8).toUpperCase()}`);
  addBytes(...CMD.BOLD_OFF);

  const dateObj = new Date(order.created_at);
  const dateFormatted = dateObj.toLocaleDateString("pt-BR");
  const timeFormatted = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  addLine(`Data: ${dateFormatted} as ${timeFormatted}`);
  addLine(`Cliente: ${order.customer_name}`);
  if (order.customer_phone) {
    addLine(`Telefone: ${order.customer_phone}`);
  }

  const isDelivery = order.delivery_type === "delivery";
  addBytes(...CMD.BOLD_ON);
  addLine(
    `Tipo: ${isDelivery ? "ENTREGA A DOMICILIO (MOTOBOY)" : "RETIRADA NO BALCAO"}`
  );
  addBytes(...CMD.BOLD_OFF);

  if (isDelivery) {
    addLine("-".repeat(48));
    addLine(`Endereco: ${order.address || ""}`);
    if (order.bairro) addLine(`Bairro: ${order.bairro}`);
    if (order.complement) addLine(`Complemento: ${order.complement}`);
    if (order.cep) addLine(`CEP: ${order.cep}`);
  }

  // Itens do Pedido
  addLine("=".repeat(48));
  addBytes(...CMD.BOLD_ON);
  addLine("ITENS DO PEDIDO:");
  addBytes(...CMD.BOLD_OFF);

  order.items.forEach((it, idx) => {
    const flavors = it.flavors.map((f) => f.name).join(" + ");
    const linePrice = `R$ ${formatPrice(it.price * it.qty)}`;

    addBytes(...CMD.BOLD_ON);
    addLine(justifyLine(`${it.qty}x ${flavors}`, linePrice, 48));
    addBytes(...CMD.BOLD_OFF);

    addLine(`   Tam: ${it.size} (${it.category})`);
    if (it.crust) {
      addLine(`   Borda: ${it.crust.name}`);
    }
    if (it.extras && it.extras.length > 0) {
      addLine(`   Extras: ${it.extras.map((e) => e.name).join(", ")}`);
    }
    if (it.removals && it.removals.length > 0) {
      addLine(`   Sem: ${it.removals.join(", ")}`);
    }
    if (it.observation) {
      addLine(`   Obs: "${it.observation}"`);
    }

    if (idx < order.items.length - 1) {
      addLine("-".repeat(48));
    }
  });

  // Resumo Financeiro
  addLine("=".repeat(48));
  addLine(
    justifyLine("Subtotal dos itens:", `R$ ${formatPrice(order.subtotal)}`, 48)
  );
  if (isDelivery) {
    addLine(
      justifyLine(
        `Taxa de Entrega (${order.bairro || "Motoboy"}):`,
        `R$ ${formatPrice(order.delivery_fee)}`,
        48
      )
    );
  } else {
    addLine(justifyLine("Taxa de Entrega:", "Gratis (Balcao)", 48));
  }

  addLine("-".repeat(48));
  addBytes(...CMD.DOUBLE_HEIGHT);
  addBytes(...CMD.BOLD_ON);
  addLine(justifyLine("TOTAL GERAL:", `R$ ${formatPrice(order.total)}`, 48));
  addBytes(...CMD.NORMAL_TEXT);
  addBytes(...CMD.BOLD_OFF);

  // Pagamento
  addLine("-".repeat(48));
  addLine(`Forma de Pagamento: ${order.payment_method}`);
  if (order.change_for && order.change_for > order.total) {
    addLine(`Troco para: R$ ${formatPrice(order.change_for)}`);
    addLine(
      `Devolver troco de: R$ ${formatPrice(order.change_for - order.total)}`
    );
  }

  // Rodapé e corte
  addBytes(...CMD.ALIGN_CENTER);
  addLine("=".repeat(48));
  addLine("Acompanhe: donluydd.com.br");
  addLine("Obrigado pela preferencia!");
  addBytes(...CMD.FEED_5);
  addBytes(...CMD.PARTIAL_CUT);

  return new Uint8Array(bytes);
}

// -------------------------------------------------------------
// WebUSB API: Impressão direta na porta USB da Epson TM-T20
// -------------------------------------------------------------

let connectedUsbDevice: USBDevice | null = null;

export async function requestEpsonUsbDevice(): Promise<USBDevice> {
  const nav = navigator as NavigatorWithUsb;
  if (!nav.usb) {
    throw new Error(
      "WebUSB não é suportado neste navegador. Use Google Chrome ou Edge."
    );
  }

  // 0x04b8 é o Vendor ID da Seiko Epson Corporation
  const device = await nav.usb.requestDevice({
    filters: [{ vendorId: 0x04b8 }],
  });

  await device.open();
  await device.selectConfiguration(1);

  // Encontra interface e endpoint de saída da impressora
  const iface = device.configuration?.interfaces[0];
  if (iface) {
    await device.claimInterface(iface.interfaceNumber);
  }

  connectedUsbDevice = device;
  return device;
}

export function getConnectedUsbDevice(): USBDevice | null {
  return connectedUsbDevice;
}

export async function printOrderViaWebUsb(
  device: USBDevice,
  order: DbOrder
): Promise<void> {
  if (!device.opened) {
    await device.open();
    await device.selectConfiguration(1);
    const iface = device.configuration?.interfaces[0];
    if (iface) {
      await device.claimInterface(iface.interfaceNumber);
    }
  }

  // Encontra o endpoint de saída (OUT)
  const iface = device.configuration?.interfaces[0];
  const endpoint = iface?.alternate.endpoints.find(
    (e) => e.direction === "out"
  );

  const endpointNumber = endpoint ? endpoint.endpointNumber : 1;
  const data = buildEpsonEscPos(order);

  // Envia os bytes para a impressora
  await device.transferOut(endpointNumber, data);
}

// -------------------------------------------------------------
// Browser Iframe Print: Para impressão silenciosa (--kiosk-printing)
// -------------------------------------------------------------

export function printOrderViaBrowser(order: DbOrder): void {
  const isDelivery = order.delivery_type === "delivery";
  const dateObj = new Date(order.created_at);
  const dateFormatted = dateObj.toLocaleDateString("pt-BR");
  const timeFormatted = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = order.items
    .map((it) => {
      const flavors = it.flavors.map((f) => f.name).join(" + ");
      const crust = it.crust
        ? `<div class="sub">🧀 Borda: ${it.crust.name}</div>`
        : "";
      const extras =
        it.extras && it.extras.length > 0
          ? `<div class="sub">🥓 Extras: ${it.extras.map((e) => e.name).join(", ")}</div>`
          : "";
      const removals =
        it.removals && it.removals.length > 0
          ? `<div class="sub">❌ Sem: ${it.removals.join(", ")}</div>`
          : "";
      const obs = it.observation
        ? `<div class="sub obs">📝 Obs: ${it.observation}</div>`
        : "";

      return `
        <div class="item">
          <div class="row bold">
            <span>${it.qty}x ${flavors}</span>
            <span>R$ ${formatPrice(it.price * it.qty)}</span>
          </div>
          <div class="sub">Tam: ${it.size} (${it.category})</div>
          ${crust}${extras}${removals}${obs}
        </div>
      `;
    })
    .join("");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comanda #${order.id.slice(0, 8)}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace, monospace;
            font-size: 13px;
            color: #000;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 4px;
            line-height: 1.35;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 18px; font-weight: bold; letter-spacing: -0.5px; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; align-items: baseline; }
          .item { margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #888; }
          .sub { font-size: 11px; color: #222; margin-left: 8px; }
          .obs { font-style: italic; font-weight: bold; }
          .total { font-size: 16px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center title">🍕 DON LUYDD PIZZARIA</div>
        <div class="center" style="font-size: 11px;">Pizzas Artesanais · Forno a Lenha</div>
        <div class="center" style="font-size: 11px;">WhatsApp: (83) 99374-0352</div>
        <div class="double-divider"></div>

        <div class="row bold">
          <span>PEDIDO #${order.id.slice(0, 8).toUpperCase()}</span>
          <span>${timeFormatted}</span>
        </div>
        <div>Data: ${dateFormatted}</div>
        <div>Cliente: <strong>${order.customer_name}</strong></div>
        ${order.customer_phone ? `<div>Telefone: ${order.customer_phone}</div>` : ""}

        <div class="divider"></div>
        <div class="bold">
          ${isDelivery ? "🛵 ENTREGA A DOMICÍLIO" : "🏬 RETIRADA NO BALCÃO"}
        </div>
        ${
          isDelivery
            ? `<div>${order.address || ""}${order.bairro ? ` · ${order.bairro}` : ""}</div>
               ${order.complement ? `<div>Comp: ${order.complement}</div>` : ""}`
            : `<div style="font-size: 11px;">Cliente retira na pizzaria</div>`
        }

        <div class="double-divider"></div>
        <div class="bold" style="margin-bottom: 4px;">ITENS:</div>
        ${itemsHtml}

        <div class="divider"></div>
        <div class="row">
          <span>Subtotal:</span>
          <span>R$ ${formatPrice(order.subtotal)}</span>
        </div>
        <div class="row">
          <span>Taxa de Entrega:</span>
          <span>${isDelivery ? `R$ ${formatPrice(order.delivery_fee)}` : "Grátis (Balcão)"}</span>
        </div>
        <div class="divider"></div>
        <div class="row total">
          <span>TOTAL GERAL:</span>
          <span>R$ ${formatPrice(order.total)}</span>
        </div>

        <div class="divider"></div>
        <div>Pagamento: <strong>${order.payment_method}</strong></div>
        ${
          order.change_for && order.change_for > order.total
            ? `<div>Troco para: R$ ${formatPrice(order.change_for)} (Devolver R$ ${formatPrice(order.change_for - order.total)})</div>`
            : ""
        }

        <div class="double-divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 6px;">
          donluydd.com.br<br/>
          Obrigado pela preferência!
        </div>
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 350);
}
