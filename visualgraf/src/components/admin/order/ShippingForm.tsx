"use client";

import { useState } from "react";
import { ActionForm } from "@/components/admin/ActionForm";
import { saveShipping } from "@/app/admin/order-actions";
import type { ShippingConfig } from "@/lib/settings";

export function ShippingForm({ config, provinces, andreaniReady }: { config: ShippingConfig; provinces: readonly string[]; andreaniReady: boolean }) {
  const [zones, setZones] = useState(config.zones);
  const [provider, setProvider] = useState(config.provider);

  function addZone() {
    const zone = { id: crypto.randomUUID(), name: "", price: null, provinces: [] };
    setZones((current) => [...current, zone]);
  }

  return (
    <ActionForm action={saveShipping} label="Guardar configuración">
      <label className="flex items-center gap-2">
        <input type="checkbox" name="enabled" defaultChecked={config.enabled} />
        Calcular envío automático
      </label>
      <fieldset className="space-y-2">
        <legend className="label">¿Cómo se calcula?</legend>
        <label className={`flex items-start gap-3 rounded-xl border p-3 ${provider === "andreani" ? "border-white bg-white/5" : "border-white/20"}`}>
          <input type="radio" name="provider" value="andreani" checked={provider === "andreani"} onChange={() => setProvider("andreani")} className="mt-1" />
          <span>
            <span className="block font-semibold">Andreani en vivo (recomendado)</span>
            <span className="text-sm text-mute">
              Cotiza con tu contrato según el código postal, el peso y el volumen de cada pack. Si algo falta o Andreani no responde, se usan las zonas de abajo.
            </span>
            <span className={`mt-1 block text-sm ${andreaniReady ? "text-brand-green" : "text-brand-yellow"}`}>
              {andreaniReady ? "✓ Contrato de Andreani configurado" : "Falta cargar ANDREANI_CLIENTE y ANDREANI_CONTRATO en Vercel"}
            </span>
          </span>
        </label>
        <label className={`flex items-start gap-3 rounded-xl border p-3 ${provider === "zonas" ? "border-white bg-white/5" : "border-white/20"}`}>
          <input type="radio" name="provider" value="zonas" checked={provider === "zonas"} onChange={() => setProvider("zonas")} className="mt-1" />
          <span>
            <span className="block font-semibold">Precio fijo por zona</span>
            <span className="text-sm text-mute">Un precio por región, sin consultar a ningún correo.</span>
          </span>
        </label>
      </fieldset>
      {provider === "andreani" && (
        <label className="block max-w-xs">
          <span className="label">Recargo sobre la tarifa de Andreani (%)</span>
          <input name="markupPercent" className="field" type="number" min="0" max="200" step="0.5" defaultValue={config.markupPercent || ""} placeholder="0" />
          <span className="mt-1 block text-xs text-mute">Para cubrir embalaje o despacho. 0 = tarifa exacta.</span>
        </label>
      )}
      {provider !== "andreani" && <input type="hidden" name="markupPercent" value={config.markupPercent || 0} />}
      <label className="block max-w-xs">
        <span className="label">Envío gratis desde $</span>
        <input name="freeFrom" className="field" type="number" min="0" step="any" defaultValue={config.freeFrom ?? ""} placeholder="Nunca" />
      </label>
      <p className="text-sm text-mute">Dejá el mínimo vacío si nunca ofrecés envío gratis. Asigná cada provincia a una sola zona.</p>
      {zones.map((zone, index) => (
        <fieldset key={zone.id} className="min-w-0 space-y-3 rounded-xl border border-white/20 p-3 sm:p-4">
          <legend className="px-2 font-semibold">Zona {index + 1}</legend>
          <input type="hidden" name="zone" value={zone.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Nombre</span>
              <input name={`name-${zone.id}`} className="field" defaultValue={zone.name} required maxLength={80} />
            </label>
            <label className="block">
              <span className="label">Precio $</span>
              <input name={`price-${zone.id}`} className="field" type="number" min="0" step="any" defaultValue={zone.price ?? ""} placeholder="A coordinar" />
            </label>
          </div>
          <fieldset>
            <legend className="label">Provincias</legend>
            <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 md:grid-cols-3">
              {provinces.map((province) => (
                <label key={province} className="flex min-h-8 items-center gap-2">
                  <input name={`provinces-${zone.id}`} value={province} type="checkbox" defaultChecked={zone.provinces.includes(province)} />
                  {province}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn btn-ghost" aria-label={`Quitar zona ${index + 1}`} onClick={() => setZones((current) => current.filter(({ id }) => id !== zone.id))}>Quitar zona</button>
        </fieldset>
      ))}
      <div><button type="button" className="btn btn-ghost" onClick={addZone}>Agregar zona</button></div>
    </ActionForm>
  );
}
