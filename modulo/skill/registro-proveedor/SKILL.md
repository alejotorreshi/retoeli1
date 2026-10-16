---
name: registro-proveedor
description: "Conocimiento del proceso de registro como proveedor de Periferia IT Group: el orden de las herramientas (proveedor_leer_solicitud, proveedor_mapear_campos, proveedor_generar_formulario, proveedor_armar_paquete, proveedor_simular_envio), los estados de cada campo, las reglas de negocio y el formato del resumen para la analista."
---
# Proceso de registro como proveedor

Este conocimiento explica cómo procesar una solicitud de registro como proveedor con las cinco herramientas. Las reglas de cada país, los umbrales de confianza y los avisos de vencimiento no se repiten aquí: viven en la configuración de las herramientas y llegan en las notas de sus resultados, que son la única fuente.

## Las cinco herramientas, en orden

1. proveedor_leer_solicitud recibe el caso y devuelve el país, el cliente, el formato pedido, la plantilla, los campos en el orden de la plantilla, los campos ambiguos y los soportes exigidos. Es siempre el primer paso de un caso.
2. proveedor_mapear_campos recibe el caso y una lista de etiquetas. Con la lista vacía mapea toda la plantilla; con algunas etiquetas responde solo esas, para preguntas puntuales como "¿cuál es el NIT?". Devuelve cada campo con su estado, su ruta en el maestro, su regla, su confianza, su nota y su valor enmascarado.
3. proveedor_generar_formulario recibe el caso y el mapeo completo que devolvió proveedor_mapear_campos sobre toda la plantilla, solo con la etiqueta, el estado y la ruta de cada campo. Nunca le pases valores: la herramienta relee cada valor del maestro y genera el formulario en el formato pedido.
4. proveedor_armar_paquete recibe el caso y arma el paquete para firma con el formulario, las copias de los soportes exigidos, el checklist y el borrador del correo. Indica si queda LISTO o BLOQUEADO y por qué.
5. proveedor_simular_envio recibe el caso y registra un envío simulado del paquete armado. Solo se usa después de que la analista confirme de forma explícita en su mensaje siguiente.

Para procesar un caso completo se usan las cuatro primeras herramientas en ese orden, y proveedor_simular_envio solo tras la confirmación. Ninguna herramienta ejecuta los pasos de otra.

## Cómo listar los casos

Si la analista pregunta qué casos hay, llama a proveedor_leer_solicitud con el caso vacío ("") y muéstrale la lista casos_disponibles de la respuesta.

Si la analista no sabe qué casos hay, o pide un caso que no existe, llama a proveedor_leer_solicitud con el caso pedido. Si no existe, la respuesta trae el código CASO_NO_ENCONTRADO y la lista casos_disponibles; muéstrala a la analista y pregúntale cuál quiere procesar.

## Estados de un campo

- lleno: el maestro tiene el dato y el formulario lo trae.
- faltante: el maestro no tiene el dato. El formulario lo deja vacío y marcado, y el checklist lo lista como acción pendiente. Nunca se completa a mano.
- requiere_confirmacion: el dato existe pero hay una duda que confirmar con el cliente o internamente. La nota del campo explica la duda; repítela tal cual.
- La confianza dice qué tan seguro es el emparejamiento entre la etiqueta de la plantilla y el maestro, y la regla dice cómo se encontró. Cuando la confianza no alcanza, la herramienta ya marca el campo por confirmar; no recalcules nada.

## Soportes y bloqueos

- Cada soporte exigido aparece como presente, vencido o ausente. Los avisos de "vence en N días" llegan en los resultados; menciónalos tal cual.
- El paquete queda BLOQUEADO si falta un soporte exigido o si un soporte está vencido. Cada bloqueo dice si el soporte está ausente o vencido.
- Los campos faltantes y por confirmar no bloquean el paquete, pero aparecen en el checklist como acciones pendientes.

## Formatos

- xlsx y pdf: proveedor_generar_formulario escribe el formulario en out/<caso>/ y devuelve su ruta.
- portal: la herramienta devuelve ok con el aviso "formato no soportado" y deja los valores para que la analista los cargue en el portal del cliente. El flujo sigue igual hasta armar el paquete.

## Reglas del negocio

- RN1: el identificador tributario cambia por país. Periferia solo tiene NIT colombiano, así que en otros países el campo se llena con el NIT y queda por confirmar como identificador extranjero; la nota del resultado lo explica.
- RN2: los datos bancarios solo se llenan si la plantilla los pide y nunca van en el borrador del correo.
- RN3: un soporte vencido o un soporte exigido ausente bloquea el paquete; un campo faltante no lo bloquea, pero aparece en el checklist.
- RN4: ninguna acción externa (envío, firma o carga a un portal) ocurre sin una confirmación explícita de la analista en el mensaje inmediatamente anterior. Un simple acuse de recibo no cuenta como confirmación explícita. El servidor lo hace cumplir. Mientras un paquete espera confirmación, una respuesta que no confirma ni rechaza, o un pedido distinto, lo deja pendiente y el servidor vuelve a agregar su pregunta; solo un rechazo explícito la cancela: una negación del envío ("no envíes", "no lo mandes", "no quiero enviarlo todavía"), aunque después venga una pregunta ("no envíes nada todavía, ¿qué falta?"), o una respuesta corta de espera sola o separada del resto por una coma o un punto ("no", "todavía no", "espera", "espera un momento", "cancela", "No, ¿qué falta?"). Un pedido distinto (por ejemplo "consulta el NIT para tenerlo a mano") no es un rechazo aunque traiga palabras como "no", "para", "luego" o "mejor" dentro de la frase o junto al nombre de otro caso. Tras una respuesta de espera, un pedido que nombra el caso que espera confirmación solo lo deja pendiente si empieza directamente con un verbo de pedido como consulta, procesa o revisa ("No, consulta el NIT de ec-corp-andina"); con otra palabra delante, o sin un verbo de pedido, el servidor cancela la confirmación ("No, por favor consulta el NIT de ec-corp-andina").
- RN5: cada herramienta deja su registro en out/log.jsonl y en out/<caso>/log.jsonl.

## Qué hacer ante cada código

- CASO_NO_ENCONTRADO: muestra los casos disponibles que trae la respuesta y pregunta cuál procesar.
- CASO_INVALIDO: pide un identificador de caso en minúsculas, dígitos y guiones.
- ARGS_INVALIDOS: corrige los argumentos según el detalle y vuelve a llamar a la herramienta.
- MAPEO_INCONSISTENTE: vuelve a ejecutar proveedor_mapear_campos sobre toda la plantilla y pasa su resultado completo a proveedor_generar_formulario.
- CAMPOS_FUERA_DE_PLANTILLA: usa solo las etiquetas esperadas que trae la respuesta.
- FORMULARIO_NO_GENERADO: primero genera el formulario con proveedor_generar_formulario y después vuelve a armar el paquete.
- PAQUETE_NO_ARMADO: primero arma el paquete con proveedor_armar_paquete y muestra su estado; el servidor vuelve a pedir la confirmación antes de enviar. La confirmación anterior ya no vale.
- PAQUETE_DESACTUALIZADO: el paquete ya no coincide con el repositorio. Si el maestro cambió, vuelve a generar el formulario con proveedor_mapear_campos y proveedor_generar_formulario; después vuelve a armar el paquete con proveedor_armar_paquete y muestra el estado nuevo; el servidor vuelve a pedir la confirmación. La confirmación anterior ya no vale.
- CONFIRMACION_REQUERIDA: el envío se bloqueó porque no hay una confirmación explícita vigente para ese caso. No reintentes. Si el paquete sigue pendiente de confirmación, el servidor agrega la pregunta al final de tu respuesta; no la escribas tú. Si el envío simulado de ese caso ya quedó registrado en esta conversación, dilo: no se repite, y otro envío necesita un proveedor_armar_paquete nuevo. Si el caso no tiene un paquete armado en esta conversación, explica que primero hay que procesarlo.
- PLANTILLA_INVALIDA, REGLAS_INVALIDAS, DATOS_INVALIDOS y CONFIGURACION_INVALIDA: explica que la plantilla, las reglas, los datos o la configuración del caso no son válidos y que hay que revisarlos; no intentes completar nada por tu cuenta.
- ERROR_INTERNO: explica que la herramienta falló y propone intentarlo de nuevo. Si falló proveedor_simular_envio, no lo reintentes en ese turno: el caso vuelve a quedar pendiente y el servidor pide la confirmación otra vez.
- HERRAMIENTA_DESCONOCIDA: usa solo las cinco herramientas de este proceso.
- ARGUMENTOS_TRUNCADOS: la respuesta se cortó antes de completar los argumentos; vuelve a llamar a la herramienta con argumentos completos y más cortos.

## Varios casos

Si la analista pide varios casos, procesa cada caso completo, de proveedor_leer_solicitud a proveedor_armar_paquete, antes de pasar al siguiente. Después da un resumen por caso; no escribas la pregunta de cierre: el servidor agrega una sola pregunta que nombra cada paquete pendiente de confirmación. Si otro paquete ya esperaba confirmación, sigue pendiente: la pregunta del servidor nombra todos los paquetes pendientes y la confirmación tiene que nombrar el caso.
