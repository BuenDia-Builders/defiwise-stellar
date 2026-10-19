/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Safe browser-only adapter for Stellar Wallets Kit (SEP-43 multi-wallet connector).
 * Prevents SSR document / window access issues during Next.js compilation.
 */

let kitInstance: any = null;

export async function getStellarWalletsKit(): Promise<any | null> {
  if (typeof window === "undefined") return null;
  if (kitInstance) return kitInstance;

  try {
    const { StellarWalletsKit, Networks } = await import(
      "@creit.tech/stellar-wallets-kit"
    );
    const { FreighterModule } = await import(
      "@creit.tech/stellar-wallets-kit/modules/freighter"
    );
    const { xBullModule } = await import(
      "@creit.tech/stellar-wallets-kit/modules/xbull"
    );
    const { AlbedoModule } = await import(
      "@creit.tech/stellar-wallets-kit/modules/albedo"
    );
    const { LobstrModule } = await import(
      "@creit.tech/stellar-wallets-kit/modules/lobstr"
    );
    const { HanaModule } = await import(
      "@creit.tech/stellar-wallets-kit/modules/hana"
    );

    StellarWalletsKit.init({
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new AlbedoModule(),
        new LobstrModule(),
        new HanaModule(),
      ],
      network: Networks.TESTNET,
    });

    kitInstance = StellarWalletsKit;
    return StellarWalletsKit;
  } catch (err) {
    console.warn("Failed to initialize StellarWalletsKit:", err);
    return null;
  }
}
