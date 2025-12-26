import { Base64 } from 'base64-string';

export function encode(data: string): string {
    const enc = new Base64();

    return enc.urlEncode(data).replace(/=+$/, '');
}

export function decode(data: string): string {
    const enc = new Base64();

    // Add back padding if needed (padding was stripped in encode)
    // Base64 strings should be multiples of 4 characters
    const paddingNeeded = (4 - (data.length % 4)) % 4;
    const paddedData = data + '='.repeat(paddingNeeded);

    return enc.decode(paddedData);
}
