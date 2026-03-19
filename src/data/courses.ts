export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  options: AnswerOption[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string; // markdown-like content for the theory
  durationMinutes: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  color: string; // tailwind color class for theming
  lessons: Lesson[];
  quiz: Question[];
  rewardXP: number;
  nftImage: string; // path to the NFT image earned on completion
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  certificateImage: string;
}

export const courses: Course[] = [
  {
    id: "intro-defi",
    title: "Introducción a DeFi",
    description:
      "Aprende los fundamentos de las finanzas descentralizadas, desde conceptos básicos hasta cómo interactuar con protocolos reales.",
    certificateImage: "/certificadoRecon.svg",
    modules: [
      {
        id: "mod-1",
        title: "¿Qué es DeFi?",
        description: "Finanzas descentralizadas: conceptos fundamentales",
        color: "active",
        rewardXP: 50,
        nftImage: "/nft/nft1.svg",
        lessons: [
          {
            id: "les-1-1",
            title: "Finanzas tradicionales vs DeFi",
            description:
              "Entendé las diferencias entre el sistema financiero tradicional y las finanzas descentralizadas.",
            durationMinutes: 10,
            content: `## Finanzas Tradicionales vs DeFi

Las finanzas tradicionales (TradFi) dependen de intermediarios: bancos, brokers, cámaras de compensación. Cada intermediario agrega costos y tiempos de procesamiento.

**DeFi** elimina estos intermediarios usando contratos inteligentes en blockchain. Las transacciones son:
- **Transparentes** — cualquiera puede verificar el código
- **Sin permisos** — no necesitás aprobación de un banco
- **Componibles** — los protocolos se conectan entre sí como piezas de LEGO

### Ejemplos concretos
- En TradFi, una transferencia internacional tarda 2-5 días y cuesta USD 25-50
- En Stellar, la misma transferencia tarda 5 segundos y cuesta menos de USD 0.01`,
          },
          {
            id: "les-1-2",
            title: "Wallets y claves",
            description:
              "Qué es una wallet, cómo funcionan las claves públicas y privadas, y cómo conectarte de forma segura.",
            durationMinutes: 8,
            content: `## Wallets y Claves

Una wallet (billetera) es tu identidad en blockchain. No guarda dinero — guarda las **claves** que te dan acceso a tus fondos.

### Clave pública vs privada
- **Clave pública**: tu dirección, como un CBU o email. La compartís para recibir fondos.
- **Clave privada**: tu contraseña. **Nunca la compartas.** Quien la tiene, controla tus fondos.

### Tipos de wallets
- **Custodial**: un tercero guarda tus claves (ej: exchange). Más simple, menos control.
- **Non-custodial**: vos guardás tus claves (ej: Freighter, MetaMask). Más responsabilidad, control total.

### Freighter
Para este curso usamos **Freighter**, la wallet oficial de Stellar. Es una extensión de navegador que te permite firmar transacciones de forma segura.`,
          },
          {
            id: "les-1-3",
            title: "Blockchain y redes",
            description:
              "Qué es una blockchain, qué son las redes (mainnet vs testnet) y por qué Stellar es ideal para DeFi.",
            durationMinutes: 12,
            content: `## Blockchain y Redes

Una blockchain es un registro distribuido e inmutable de transacciones. Cada bloque contiene un grupo de transacciones y está enlazado al anterior.

### Mainnet vs Testnet
- **Mainnet**: la red principal con valor real. Las transacciones cuestan dinero.
- **Testnet**: red de prueba con tokens sin valor. Ideal para aprender sin riesgo.

### ¿Por qué Stellar?
Stellar fue diseñada para pagos y activos digitales:
- **Velocidad**: transacciones en ~5 segundos
- **Costo**: fees de ~0.00001 XLM (prácticamente gratis)
- **Soroban**: plataforma de smart contracts de Stellar, potente y eficiente
- **Ecosistema**: DEXs, lending, stablecoins, y más

En este curso trabajamos en **Stellar Testnet** para que puedas practicar sin riesgo.`,
          },
        ],
        quiz: [
          {
            id: "q-1-1",
            prompt:
              "¿Cuál es la principal diferencia entre finanzas tradicionales y DeFi?",
            options: [
              {
                text: "DeFi usa intermediarios más rápidos",
                isCorrect: false,
              },
              {
                text: "DeFi elimina intermediarios usando contratos inteligentes",
                isCorrect: true,
              },
              {
                text: "DeFi solo funciona con Bitcoin",
                isCorrect: false,
              },
              {
                text: "No hay diferencia, son lo mismo",
                isCorrect: false,
              },
            ],
          },
          {
            id: "q-1-2",
            prompt: "¿Qué es una clave privada?",
            options: [
              {
                text: "Tu dirección pública para recibir fondos",
                isCorrect: false,
              },
              {
                text: "La contraseña de tu email",
                isCorrect: false,
              },
              {
                text: "La clave que da control total sobre tus fondos — nunca debe compartirse",
                isCorrect: true,
              },
              {
                text: "Un código que te da el banco",
                isCorrect: false,
              },
            ],
          },
          {
            id: "q-1-3",
            prompt: "¿Cuánto tarda una transacción en Stellar aproximadamente?",
            options: [
              { text: "2-5 días", isCorrect: false },
              { text: "10 minutos", isCorrect: false },
              { text: "~5 segundos", isCorrect: true },
              { text: "1 hora", isCorrect: false },
            ],
          },
          {
            id: "q-1-4",
            prompt: "¿Qué es una testnet?",
            options: [
              {
                text: "Una red con tokens reales para testing",
                isCorrect: false,
              },
              {
                text: "Una red de prueba con tokens sin valor real, ideal para aprender",
                isCorrect: true,
              },
              {
                text: "Una red privada solo para empresas",
                isCorrect: false,
              },
              {
                text: "La red principal de producción",
                isCorrect: false,
              },
            ],
          },
        ],
      },
      {
        id: "mod-2",
        title: "¿Cómo funciona DeFi?",
        description: "Protocolos, liquidez y los building blocks de DeFi",
        color: "pink",
        rewardXP: 75,
        nftImage: "/nft/nft2.svg",
        lessons: [
          {
            id: "les-2-1",
            title: "Tokens y activos digitales",
            description:
              "Qué son los tokens, tipos de tokens y cómo representan valor en blockchain.",
            durationMinutes: 10,
            content: `## Tokens y Activos Digitales

Un token es una representación digital de valor en una blockchain. Hay varios tipos:

### Tokens fungibles
- Cada unidad es idéntica e intercambiable (como el dinero)
- Ejemplos: USDC, XLM, PATH
- En Stellar se crean como **Stellar Assets** o **Soroban tokens**

### Tokens no fungibles (NFTs)
- Cada uno es único e irrepetible
- Representan propiedad de algo específico: arte, certificados, badges
- En este curso, ganás NFTs únicos por completar módulos

### Stablecoins
- Tokens cuyo valor está atado a una moneda fiat (ej: USDC = 1 USD)
- Son la base de DeFi porque dan estabilidad
- Stellar tiene varias stablecoins nativas con on/off ramps fiat`,
          },
          {
            id: "les-2-2",
            title: "DEX y AMMs",
            description:
              "Exchanges descentralizados, automated market makers y cómo funciona el trading sin intermediarios.",
            durationMinutes: 12,
            content: `## DEX y AMMs

Un **DEX** (exchange descentralizado) permite intercambiar tokens sin intermediarios. No hay una empresa detrás — el código maneja todo.

### ¿Cómo funciona un AMM?
Un **Automated Market Maker** usa pools de liquidez en vez de un libro de órdenes:

1. Proveedores de liquidez depositan pares de tokens (ej: XLM/USDC)
2. La fórmula x * y = k determina el precio automáticamente
3. Los traders intercambian contra el pool, no contra otra persona

### DEXs en Stellar
- **SDEX**: el exchange descentralizado nativo de Stellar, integrado al protocolo
- **Soroswap**: AMM estilo Uniswap construido sobre Soroban
- **Phoenix**: DEX con order book en Soroban

### Ventajas de un DEX
- Sin registro ni KYC para operar
- Tus fondos siempre están en tu wallet
- Transparencia total — el código es público`,
          },
          {
            id: "les-2-3",
            title: "Lending y Borrowing",
            description:
              "Cómo funcionan los protocolos de préstamos descentralizados.",
            durationMinutes: 10,
            content: `## Lending y Borrowing

Los protocolos de lending te permiten prestar y pedir prestado sin un banco.

### ¿Cómo funciona?
1. **Lenders** depositan tokens en un pool y ganan intereses
2. **Borrowers** depositan colateral y piden prestado contra él
3. Los intereses se calculan algorítmicamente según oferta/demanda

### Colateral y liquidación
- Siempre necesitás depositar **más** de lo que pedís prestado (sobre-colateralización)
- Si tu colateral baja de valor, el protocolo lo liquida para proteger a los lenders
- Ejemplo: depositás 150 USDC de colateral para pedir 100 USDC prestados

### Blend en Stellar
**Blend** es el protocolo de lending/borrowing principal en Stellar:
- Pools de préstamos con tasas variables
- Soporte para XLM, USDC y otros activos
- Construido sobre Soroban`,
          },
        ],
        quiz: [
          {
            id: "q-2-1",
            prompt: "¿Qué es un token fungible?",
            options: [
              {
                text: "Un token único e irrepetible",
                isCorrect: false,
              },
              {
                text: "Un token donde cada unidad es idéntica e intercambiable",
                isCorrect: true,
              },
              {
                text: "Un token que solo existe en Ethereum",
                isCorrect: false,
              },
              {
                text: "Un token que no se puede transferir",
                isCorrect: false,
              },
            ],
          },
          {
            id: "q-2-2",
            prompt: "¿Qué usa un AMM en vez de un libro de órdenes?",
            options: [
              { text: "Inteligencia artificial", isCorrect: false },
              { text: "Pools de liquidez", isCorrect: true },
              { text: "Un servidor centralizado", isCorrect: false },
              { text: "Subastas en tiempo real", isCorrect: false },
            ],
          },
          {
            id: "q-2-3",
            prompt:
              "En un protocolo de lending, ¿qué pasa si el colateral baja mucho de valor?",
            options: [
              {
                text: "No pasa nada, el préstamo sigue igual",
                isCorrect: false,
              },
              {
                text: "El protocolo liquida el colateral para proteger a los lenders",
                isCorrect: true,
              },
              {
                text: "El borrower recibe más tokens gratis",
                isCorrect: false,
              },
              {
                text: "El protocolo se apaga automáticamente",
                isCorrect: false,
              },
            ],
          },
          {
            id: "q-2-4",
            prompt:
              "¿Cuál de estos es el DEX nativo integrado al protocolo de Stellar?",
            options: [
              { text: "Uniswap", isCorrect: false },
              { text: "Soroswap", isCorrect: false },
              { text: "SDEX", isCorrect: true },
              { text: "PancakeSwap", isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
];
