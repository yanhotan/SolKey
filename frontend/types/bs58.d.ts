declare module 'bs58' {
  export function encode(source: Uint8Array): string;
  export function decode(str: string): Uint8Array;
  
  export default {
    encode,
    decode
  };
} 