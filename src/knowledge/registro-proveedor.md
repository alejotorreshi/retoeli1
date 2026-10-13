# Proceso de registro como proveedor

Este conocimiento explica cómo procesar una solicitud de registro como proveedor con las cinco herramientas. Las reglas de cada país, los umbrales y los avisos no se repiten aquí: llegan en las notas de los resultados de las herramientas, que son la única fuente.

## Las herramientas, en orden

1. proveedor_leer_solicitud recibe el caso y devuelve el país, el cliente, el formato pedido, la plantilla, los campos en el orden de la plantilla y los soportes exigidos.
2. proveedor_mapear_campos recibe el caso (y, si se quiere, solo algunas etiquetas) y devuelve cada campo con su estado, su ruta en el maestro, su regla, su confianza y su valor enmascarado.
3. proveedor_generar_formulario recibe el caso y el mapeo completo que devolvió proveedor_mapear_campos, solo con etiqueta, estado y ruta de cada campo. Genera el formulario en el formato pedido releyendo cada valor del maestro.
4. proveedor_armar_paquete recibe el caso y arma el paquete para firma con el formulario, las copias de los soportes exigidos y el checklist. Indica si queda LISTO o BLOQUEADO y por qué.
5. proveedor_simular_envio recibe el caso y registra un envío simulado del paquete armado. Solo se usa después de que la analista confirme de forma explícita en su mensaje siguiente.

Para procesar un caso completo se usan las herramientas en ese orden. Ninguna herramienta ejecuta los pasos de otra.

## Cómo listar los casos

Si la analista no sabe qué casos hay, o pide un caso que no existe, llama a proveedor_leer_solicitud con el caso pedido. Si no existe, la respuesta trae el código CASO_NO_ENCONTRADO y la lista casos_disponibles; muéstrala a la analista.

## Estados de un campo

- lleno: el maestro tiene el dato y el formulario lo trae.
- faltante: el maestro no tiene el dato. El formulario lo deja vacío y marcado, y el checklist lo lista. Un faltante no bloquea el paquete.
- requiere_confirmacion: el dato existe pero hay una duda que confirmar con el cliente o internamente. La nota del campo explica la duda.

## Cómo leer el paquete

- El paquete queda BLOQUEADO si falta un soporte exigido o si un soporte está vencido. Cada bloqueo dice si el soporte está ausente o vencido.
- Los campos faltantes y por confirmar no bloquean el paquete, pero aparecen en el checklist como acciones pendientes.
- Un paquete BLOQUEADO también se puede enviar con la confirmación de la analista; el envío simulado registra los bloqueos vigentes.

## Reglas del negocio

- El identificador tributario cambia por país. Periferia solo tiene NIT colombiano, así que en otros países el campo se llena con el NIT y queda por confirmar; la nota del resultado lo explica.
- Los datos bancarios solo se llenan si la plantilla los pide y nunca van en el borrador del correo.
- Un soporte vencido o un soporte exigido ausente bloquea el paquete; un campo faltante no lo bloquea.
- Ninguna acción externa ocurre sin una confirmación explícita de la analista en el mensaje inmediatamente anterior.
- Cada herramienta deja su registro en out/log.jsonl y en out/<caso>/log.jsonl.

## Qué hacer ante cada error

- CASO_NO_ENCONTRADO: muestra los casos disponibles que trae la respuesta.
- CASO_INVALIDO: pide un identificador en minúsculas, dígitos y guiones.
- ARGS_INVALIDOS: corrige los argumentos según el detalle y vuelve a llamar a la herramienta.
- MAPEO_INCONSISTENTE: vuelve a pasar a proveedor_generar_formulario el mapeo completo que devolvió proveedor_mapear_campos.
- CAMPOS_FUERA_DE_PLANTILLA: usa solo las etiquetas de la plantilla del caso.
- FORMULARIO_NO_GENERADO: primero genera el formulario con proveedor_generar_formulario.
- PAQUETE_NO_ARMADO: primero arma el paquete con proveedor_armar_paquete.
- PAQUETE_DESACTUALIZADO: vuelve a generar el formulario si hace falta, vuelve a armar el paquete, muestra el estado nuevo y pide confirmación de nuevo.
- CONFIRMACION_REQUERIDA: el envío se bloqueó porque la analista no lo confirmó; pregúntale si quiere registrarlo.
- PLANTILLA_INVALIDA, REGLAS_INVALIDAS, DATOS_INVALIDOS y CONFIGURACION_INVALIDA: explica que los datos o la configuración del caso no son válidos y que hay que revisarlos.
- ERROR_INTERNO: explica que la herramienta falló y propone intentarlo de nuevo.
- HERRAMIENTA_DESCONOCIDA: usa solo las cinco herramientas de esta lista.
- ARGUMENTOS_TRUNCADOS: vuelve a llamar a la herramienta con argumentos completos.
