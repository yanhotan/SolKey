declare module 'tweetnacl' {
  export interface BoxKeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  export interface SignKeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  export interface BoxProps {
    (
      message: Uint8Array,
      nonce: Uint8Array,
      publicKey: Uint8Array,
      secretKey: Uint8Array
    ): Uint8Array;
    
    keyPair: {
      (): BoxKeyPair;
      fromSecretKey(secretKey: Uint8Array): BoxKeyPair;
    };
    open(
      message: Uint8Array,
      nonce: Uint8Array,
      publicKey: Uint8Array,
      secretKey: Uint8Array
    ): Uint8Array | null;
  }

  export interface SignProps {
    keyPair: {
      (): SignKeyPair;
      fromSeed(seed: Uint8Array): SignKeyPair;
    };
    detached: {
      verify(
        message: Uint8Array,
        signature: Uint8Array,
        publicKey: Uint8Array
      ): boolean;
    };
  }

  export const randomBytes: (length: number) => Uint8Array;
  export const box: BoxProps;
  export const sign: SignProps;

  export default {
    randomBytes,
    box,
    sign
  };
} 