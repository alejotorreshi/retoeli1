import { ORDEN_PESTANAS, PESTANA } from "@web/config/constants/ui.constants.ts";
import { pestanaPorTecla } from "@web/features/disposicion/estado/pestanas.ts";
import type {
  ControlBarraPestanas,
  Pestana,
  PropsBarraPestanas,
  RegistroDeBoton,
} from "@web/types/ui.type.ts";
import { type KeyboardEvent, type RefObject, useRef, useState } from "react";

function registroDe(botones: RefObject<Map<Pestana, HTMLButtonElement>>, pestana: Pestana): RegistroDeBoton {
  return (boton) => {
    if (boton === null) botones.current.delete(pestana);
    else botones.current.set(pestana, boton);
  };
}

export function useBarraPestanas({ control, ids }: PropsBarraPestanas): ControlBarraPestanas {
  const botones = useRef(new Map<Pestana, HTMLButtonElement>());
  const [registros] = useState(
    () =>
      ({
        [PESTANA.CHAT]: registroDe(botones, PESTANA.CHAT),
        [PESTANA.CASOS]: registroDe(botones, PESTANA.CASOS),
      }) as const satisfies Record<Pestana, RegistroDeBoton>,
  );

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>): void {
    const destino = pestanaPorTecla(evento.key, control.pestana);
    if (destino === null) return;
    evento.preventDefault();
    control.elegir(destino);
    botones.current.get(destino)?.focus();
  }

  const pestanas = ORDEN_PESTANAS.map((pestana) => ({
    pestana,
    id: ids.pestana(pestana),
    idVista: ids.vista(pestana),
    elegida: pestana === control.pestana,
    conPunto: pestana === PESTANA.CASOS && control.cambiosSinVer,
    registrar: registros[pestana],
    alElegir: () => control.elegir(pestana),
  }));

  return { pestanas, alTeclear };
}
