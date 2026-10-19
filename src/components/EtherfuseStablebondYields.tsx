"use client";

import React, { useState } from "react";
import { useEtherfuseYields } from "@/hooks/useEtherfuseYields";
import {
  BsShieldCheck,
  BsArrowRepeat,
  BsInfoCircle,
  BsGraphUpArrow,
  BsCheckCircleFill,
  BsExclamationTriangleFill,
} from "react-icons/bs";

export default function EtherfuseStablebondYields() {
  const { data, loading, error, refresh } = useEtherfuseYields();

  // Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(10000);
  const [selectedBondSymbol, setSelectedBondSymbol] = useState<string>("CETES");
  const [assumedInflation, setAssumedInflation] = useState<number>(8.0);

  if (loading && !data) {
    return (
      <div className="my-8 p-6 rounded-2xl bg-white border border-borderGrey/50 shadow-sm animate-pulse">
        <div className="h-6 w-1/3 bg-progressGrey/60 rounded mb-4"></div>
        <div className="h-4 w-2/3 bg-progressGrey/40 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-progressGrey/20 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const selectedBond = items.find((b) => b.symbol === selectedBondSymbol) || items[0];

  // Calculation for educational comparison
  const bondYieldEst = selectedBond?.symbol === "CETES"
    ? 10.5
    : selectedBond?.symbol === "TESOURO"
    ? 11.25
    : selectedBond?.symbol === "USTRY"
    ? 4.8
    : 3.2;

  // Real purchasing power after 1 year: amount * (1 + yield/100) / (1 + inflation/100)
  const traditionalEnd = calcAmount / (1 + assumedInflation / 100);
  const bondEnd = (calcAmount * (1 + bondYieldEst / 100)) / (1 + assumedInflation / 100);
  const purchasingPowerDiff = bondEnd - traditionalEnd;

  return (
    <div className="my-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/30 p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700">
              <BsShieldCheck size={20} />
            </span>
            <h3 className="text-xl font-bold text-darkGreen">
              Rendimientos Soberanos en Stellar (Etherfuse Stablebonds)
            </h3>
          </div>
          <p className="text-sm text-darkGrey max-w-2xl">
            En lugar de sufrir la pérdida silenciosa del poder adquisitivo, los Stablebonds tokenizan bonos gubernamentales en Stellar que acumulan interés compuesto sobre el precio del activo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.isFallback ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              <BsExclamationTriangleFill size={11} />
              Caché verificada (Offline)
            </span>
          ) : data?.stale ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <BsInfoCircle size={11} />
              Datos en caché
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <BsCheckCircleFill size={11} />
              Datos en vivo (Etherfuse API)
            </span>
          )}

          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-darkGrey hover:text-darkOrange border border-borderGrey/60 bg-white hover:bg-orange-50 transition-all cursor-pointer"
            title="Actualizar datos desde Etherfuse"
          >
            <BsArrowRepeat size={12} className={loading ? "animate-spin" : ""} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Nota de conexión: {error}. Mostrando datos de respaldo validados de Etherfuse.
        </div>
      )}

      {/* Grid of Sovereign Stablebonds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {items.map((bond) => (
          <div
            key={bond.symbol}
            className={`p-5 rounded-xl border transition-all ${
              selectedBondSymbol === bond.symbol
                ? "border-darkOrange bg-orange-50/20 shadow-sm"
                : "border-borderGrey/40 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl" role="img" aria-label={bond.country}>
                {bond.countryFlag}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-darkGreen/10 text-darkGreen">
                {bond.currency}
              </span>
            </div>

            <h4 className="font-bold text-darkGreen text-base leading-tight">
              {bond.name}
            </h4>
            <p className="text-xs text-darkGrey mt-0.5">{bond.country}</p>

            <div className="mt-4 pt-3 border-t border-dashed border-borderGrey/40">
              <div className="text-xs text-grey">Precio actual</div>
              <div className="text-lg font-bold text-darkGreen">
                ${bond.currentPrice.toFixed(4)}{" "}
                <span className="text-xs font-normal text-grey">{bond.currency}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-0.5">
                <BsGraphUpArrow size={11} />
                +{bond.appreciationPercent.toFixed(2)}% interés acumulado
              </div>
            </div>

            <div className="mt-3 text-[11px] text-darkGrey">
              <span className="block font-medium text-darkGreen/80">Referencia:</span>
              <span className="line-clamp-2">{bond.benchmarkRateDescription}</span>
            </div>

            <div className="mt-3 pt-2 text-[10px] text-grey font-mono truncate" title={bond.stellarTokenIdentifier}>
              Stellar: {bond.stellarTokenIdentifier.split("-")[0]}:...{bond.stellarIssuer.slice(-6)}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Didactic Calculator */}
      <div className="mt-8 p-6 rounded-xl bg-white border border-emerald-100 shadow-xs">
        <h4 className="font-bold text-darkGreen text-base flex items-center gap-2 mb-3">
          <BsGraphUpArrow className="text-darkOrange" />
          Simulador Didáctico: ¿Cómo defiende tu dinero un Stablebond?
        </h4>
        <p className="text-xs text-darkGrey mb-5">
          Calculá el impacto de la inflación contra el rendimiento de un bono soberano tokenizado en Stellar a 1 año.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-darkGreen mb-1">
              Bono Soberano
            </label>
            <select
              value={selectedBondSymbol}
              onChange={(e) => setSelectedBondSymbol(e.target.value)}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-borderGrey bg-white text-darkGreen focus:outline-darkOrange"
            >
              {items.map((b) => (
                <option key={b.symbol} value={b.symbol}>
                  {b.countryFlag} {b.name} ({b.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-darkGreen mb-1">
              Monto ({selectedBond?.currency || "MXN"})
            </label>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(Math.max(100, Number(e.target.value) || 0))}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-borderGrey bg-white text-darkGreen focus:outline-darkOrange"
              min="100"
              step="500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-darkGreen mb-1">
              Inflación anual estimada (%)
            </label>
            <input
              type="number"
              value={assumedInflation}
              onChange={(e) => setAssumedInflation(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-borderGrey bg-white text-darkGreen focus:outline-darkOrange"
              min="0"
              max="150"
              step="0.5"
            />
          </div>
        </div>

        {/* Results summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50/60 to-teal-50/40 border border-emerald-200/60">
          <div>
            <span className="text-xs text-grey block">Poder de compra bajo el colchón / banco (0%)</span>
            <span className="text-base font-bold text-pink">
              ${Math.round(traditionalEnd).toLocaleString()}{" "}
              <span className="text-xs font-normal">(-{(calcAmount - traditionalEnd).toLocaleString()})</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-grey block">Poder de compra en {selectedBond?.name} (~{bondYieldEst}%)</span>
            <span className="text-base font-bold text-emerald-700">
              ${Math.round(bondEnd).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-darkOrange">
                (+${Math.round(purchasingPowerDiff).toLocaleString()} protegidos)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Acceptance Criteria #5: Educational Disclaimer */}
      <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
        <BsInfoCircle className="text-amber-700 flex-shrink-0 mt-0.5" size={14} />
        <div>
          <strong>Nota educativa (Stellar Testnet / Demo):</strong> Los datos expuestos provienen de la API pública de Etherfuse y reflejan bonos soberanos tokenizados en Stellar. Este módulo ha sido concebido exclusivamente con propósitos didácticos para la plataforma educativa DeFiWise y no constituye en ningún caso asesoramiento financiero ni recomendación de inversión.
        </div>
      </div>
    </div>
  );
}
