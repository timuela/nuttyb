/**
 * Checks Base64 encoding and decoding functionality.
 */

import { describe, expect, test } from 'bun:test';

import { decode, encode } from '@/lib/encoders/base64';

const TEST_STRING =
    'The quick brown fox jumps over the lazy dog. 1234567890!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~';

describe('Base64 Encoding/Decoding', () => {
    test('Encoder produces Base64 without padding', () => {
        const encoded = encode(TEST_STRING);
        expect(encoded).toBeDefined();
        expect(encoded).toBeString();
        expect(encoded.endsWith('=')).toBeFalse();
    });

    test('Decoder produces original string', () => {
        const encoded = encode(TEST_STRING);
        const decoded = decode(encoded);
        expect(decoded).toBe(TEST_STRING);
    });
});
