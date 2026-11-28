// Utility untuk mencetak struk ke Printer Thermal POS (ESC/POS)
// Mendukung koneksi Wireless (Web Bluetooth) dan Wired (WebUSB)

const BLE_PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE Thermal Printer
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Star / Xprinter / Generic
    '0000ff00-0000-1000-8000-00805f9b34fb', // Common Chinese POS
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC / Microchip BLE
    '0000ae30-0000-1000-8000-00805f9b34fb', // Generic BLE
];

const BLE_WRITE_CHARACTERISTICS = [
    '00002af1-0000-1000-8000-00805f9b34fb',
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
    '0000ff02-0000-1000-8000-00805f9b34fb',
    '49535343-8841-43f4-a8d4-ecbe34729bb3',
    '0000ae01-0000-1000-8000-00805f9b34fb',
];

const PAPER_WIDTH_KEY = 'bms_pos_paper_width';
const AUTO_PRINT_KEY = 'bms_pos_auto_print';

let connectionState = {
    connected: false,
    type: null, // 'bluetooth' | 'usb' | null
    name: '',
    device: null,
    characteristic: null,
    usbEndpoint: null,
    usbInterface: null,
};

const listeners = new Set();

const notifyListeners = () => {
    const snapshot = getPrinterState();
    listeners.forEach((cb) => cb(snapshot));
};

export const getPrinterState = () => ({
    connected: connectionState.connected,
    type: connectionState.type,
    name: connectionState.name,
});

export const subscribePrinterState = (callback) => {
    listeners.add(callback);
    callback(getPrinterState());
    return () => listeners.delete(callback);
};

export const getPaperWidth = () => {
    const saved = localStorage.getItem(PAPER_WIDTH_KEY);
    return saved === '80' ? 80 : 58;
};

export const setPaperWidth = (width) => {
    localStorage.setItem(PAPER_WIDTH_KEY, String(width === 80 ? 80 : 58));
};

export const getAutoPrint = () => {
    return localStorage.getItem(AUTO_PRINT_KEY) === '1';
};

export const setAutoPrint = (enabled) => {
    localStorage.setItem(AUTO_PRINT_KEY, enabled ? '1' : '0');
};

export const isBluetoothSupported = () =>
    typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);

export const isUsbSupported = () =>
    typeof navigator !== 'undefined' && Boolean(navigator.usb);

export const disconnectPrinter = async () => {
    try {
        if (connectionState.type === 'bluetooth' && connectionState.device?.gatt?.connected) {
            connectionState.device.gatt.disconnect();
        }
        if (connectionState.type === 'usb' && connectionState.device) {
            if (connectionState.usbInterface !== null) {
                await connectionState.device.releaseInterface(connectionState.usbInterface).catch(() => {});
            }
            await connectionState.device.close().catch(() => {});
        }
    } finally {
        connectionState = {
            connected: false,
            type: null,
            name: '',
            device: null,
            characteristic: null,
            usbEndpoint: null,
            usbInterface: null,
        };
        notifyListeners();
    }
};

export const connectBluetoothPrinter = async () => {
    if (!isBluetoothSupported()) {
        throw new Error('Browser tidak mendukung Web Bluetooth. Gunakan Chrome/Edge di HTTPS.');
    }

    await disconnectPrinter();

    const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINTER_SERVICES,
    });

    device.addEventListener('gattserverdisconnected', () => {
        if (connectionState.device === device) {
            connectionState = {
                connected: false,
                type: null,
                name: '',
                device: null,
                characteristic: null,
                usbEndpoint: null,
                usbInterface: null,
            };
            notifyListeners();
        }
    });

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();

    let writableChar = null;
    for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const uuid of BLE_WRITE_CHARACTERISTICS) {
            const match = chars.find((c) => c.uuid.toLowerCase() === uuid);
            if (match && (match.properties.write || match.properties.writeWithoutResponse)) {
                writableChar = match;
                break;
            }
        }
        if (writableChar) break;

        const fallback = chars.find(
            (c) => c.properties.write || c.properties.writeWithoutResponse
        );
        if (fallback) {
            writableChar = fallback;
            break;
        }
    }

    if (!writableChar) {
        device.gatt.disconnect();
        throw new Error('Characteristic cetak ESC/POS tidak ditemukan pada perangkat Bluetooth ini.');
    }

    connectionState = {
        connected: true,
        type: 'bluetooth',
        name: device.name || 'Printer Bluetooth',
        device,
        characteristic: writableChar,
        usbEndpoint: null,
        usbInterface: null,
    };
    notifyListeners();
    return getPrinterState();
};

export const connectUsbPrinter = async () => {
    if (!isUsbSupported()) {
        throw new Error('Browser tidak mendukung WebUSB. Gunakan Chrome/Edge di HTTPS.');
    }

    await disconnectPrinter();

    const device = await navigator.usb.requestDevice({
        filters: [{ classCode: 0x07 }, {}].slice(0, 1), // Printer class 0x07
    }).catch(async (err) => {
        if (err?.name === 'NotFoundError') throw err;
        // Fallback jika user memilih printer non-standard class
        return navigator.usb.requestDevice({ filters: [] });
    });

    await device.open();
    if (device.configuration === null) {
        await device.selectConfiguration(1);
    }

    let targetInterface = null;
    let targetEndpoint = null;

    for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
            const outEp = alt.endpoints.find((ep) => ep.direction === 'out');
            if (outEp) {
                targetInterface = iface.interfaceNumber;
                targetEndpoint = outEp.endpointNumber;
                break;
            }
        }
        if (targetEndpoint !== null) break;
    }

    if (targetInterface === null || targetEndpoint === null) {
        await device.close().catch(() => {});
        throw new Error('Endpoint output USB printer tidak ditemukan.');
    }

    await device.claimInterface(targetInterface);

    connectionState = {
        connected: true,
        type: 'usb',
        name: device.productName || 'Printer USB',
        device,
        characteristic: null,
        usbEndpoint: targetEndpoint,
        usbInterface: targetInterface,
    };
    notifyListeners();
    return getPrinterState();
};

const sendRawBytes = async (bytes) => {
    if (!connectionState.connected) {
        throw new Error('Printer POS belum terhubung.');
    }

    if (connectionState.type === 'bluetooth') {
        const char = connectionState.characteristic;
        if (!connectionState.device?.gatt?.connected) {
            await disconnectPrinter();
            throw new Error('Koneksi Bluetooth printer terputus. Silakan hubungkan ulang.');
        }

        const chunkSize = 20;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            if (char.properties.writeWithoutResponse && char.writeValueWithoutResponse) {
                await char.writeValueWithoutResponse(chunk);
            } else {
                await char.writeValue(chunk);
            }
            await new Promise((r) => setTimeout(r, 15));
        }
        return;
    }

    if (connectionState.type === 'usb') {
        await connectionState.device.transferOut(connectionState.usbEndpoint, bytes);
    }
};

const formatIDR = (val) =>
    'Rp ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val || 0);

const padPair = (left, right, width) => {
    const l = String(left || '');
    const r = String(right || '');
    const space = width - l.length - r.length;
    if (space >= 1) {
        return l + ' '.repeat(space) + r;
    }
    return `${l}\n${' '.repeat(Math.max(0, width - r.length))}${r}`;
};

const wrapText = (text, width) => {
    const str = String(text || '');
    if (str.length <= width) return [str];
    const lines = [];
    for (let i = 0; i < str.length; i += width) {
        lines.push(str.slice(i, i + width));
    }
    return lines;
};

export const buildEscPosReceipt = (data, title = 'BUKTI SETORAN TUNAI', paperMm = 58) => {
    const width = paperMm === 80 ? 48 : 32;
    const divider = '-'.repeat(width);
    const encoder = new TextEncoder();
    const chunks = [];

    const pushBytes = (...arr) => chunks.push(new Uint8Array(arr));
    const pushText = (str) => chunks.push(encoder.encode(str + '\n'));

    // ESC @ (Initialize)
    pushBytes(0x1b, 0x40);

    // Align Center
    pushBytes(0x1b, 0x61, 0x01);
    // Bold ON + Double Height/Width OFF
    pushBytes(0x1b, 0x45, 0x01);
    pushText('BANK SANTRI');
    pushBytes(0x1b, 0x45, 0x00);
    pushText('E-PANYEPPEN');
    pushText(title.toUpperCase());
    pushText(divider);

    // Align Left
    pushBytes(0x1b, 0x61, 0x00);
    const nowStr = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    pushText(padPair('Tanggal', nowStr, width));
    pushText(padPair('Ref', data.payment_ref || data.reference_number || '-', width));
    pushText(padPair('NIS/Rek', data.account_number || '-', width));

    const nameLines = wrapText(`Nama: ${(data.customer_name || '-').toUpperCase()}`, width);
    nameLines.forEach(pushText);

    if (data.package_name || data.type) {
        const typeLines = wrapText(`Jenis: ${data.package_name || data.type}`, width);
        typeLines.forEach(pushText);
    }

    pushText(divider);

    // Bold Nominal
    pushBytes(0x1b, 0x45, 0x01);
    pushText(padPair('TOTAL', formatIDR(data.amount || data.total_amount), width));
    pushBytes(0x1b, 0x45, 0x00);

    if (data.balance_after !== undefined && data.balance_after !== null) {
        pushText(padPair('Saldo Akhir', formatIDR(data.balance_after), width));
    }

    if (data.description) {
        pushText(divider);
        wrapText(`Ket: ${data.description}`, width).forEach(pushText);
    }

    pushText(divider);

    // Footer Center
    pushBytes(0x1b, 0x61, 0x01);
    pushText('Terima Kasih');
    pushText('Simpan struk sebagai bukti sah');

    // Feed 4 lines + Partial Cut (GS V 66 0)
    pushBytes(0x1b, 0x64, 0x04);
    pushBytes(0x1d, 0x56, 0x42, 0x00);

    const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
        result.set(c, offset);
        offset += c.length;
    }
    return result;
};

export const printThermalReceipt = async (receiptData, title = 'BUKTI SETORAN TUNAI') => {
    const paperMm = getPaperWidth();
    const bytes = buildEscPosReceipt(receiptData, title, paperMm);
    await sendRawBytes(bytes);
};
