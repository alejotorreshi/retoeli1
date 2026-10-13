Para: {{para}}
Asunto: {{asunto}}

Buenos días, equipo de {{cliente}}:

{{#adjunta_formulario}}Adjuntamos el formulario de registro como proveedor ({{formulario}}) y los siguientes soportes:
{{/adjunta_formulario}}{{^adjunta_formulario}}El formulario de registro como proveedor se diligencia en su portal. Adjuntamos los siguientes soportes:
{{/adjunta_formulario}}
{{#soportes_adjuntos}}- {{nombre}} ({{archivo}})
{{/soportes_adjuntos}}{{^soportes_adjuntos}}- Ninguno por ahora.
{{/soportes_adjuntos}}
{{#hay_por_confirmar}}Antes de la firma necesitamos que nos confirmen qué dato de nuestra empresa esperan en estos campos:
{{/hay_por_confirmar}}{{#por_confirmar}}- {{etiqueta}}
{{/por_confirmar}}{{#hay_por_confirmar}}
{{/hay_por_confirmar}}{{#hay_aviso_emisor}}Estos soportes fueron emitidos en otro país; les agradecemos confirmarnos si los aceptan:
{{/hay_aviso_emisor}}{{#con_aviso_emisor}}- {{nombre}} (país emisor: {{pais_emisor}})
{{/con_aviso_emisor}}{{#hay_aviso_emisor}}
{{/hay_aviso_emisor}}{{#hay_campos_sin_dato}}Estos campos del formulario quedan en blanco porque no contamos con el dato; les agradecemos indicarnos si aplican para su registro:
{{/hay_campos_sin_dato}}{{#campos_sin_dato}}- {{etiqueta}}
{{/campos_sin_dato}}{{#hay_campos_sin_dato}}
{{/hay_campos_sin_dato}}{{#hay_soportes_pendientes}}Quedan pendientes estos soportes:
{{/hay_soportes_pendientes}}{{#soportes_pendientes}}- {{texto}}
{{/soportes_pendientes}}{{#hay_soportes_pendientes}}Los enviaremos por separado.

{{/hay_soportes_pendientes}}{{#firma_lista}}El formulario queda listo para la firma de nuestro representante legal.

{{/firma_lista}}{{#firma_tras_confirmar}}Con su confirmación pasaremos el formulario a la firma de nuestro representante legal.

{{/firma_tras_confirmar}}{{#firma_tras_validar}}Validaremos internamente algunos datos del formulario antes de pasarlo a la firma de nuestro representante legal.

{{/firma_tras_validar}}{{#firma_bloqueada}}El formulario todavía no está listo para la firma de nuestro representante legal: faltan los soportes pendientes indicados.

{{/firma_bloqueada}}Quedamos atentos a cualquier comentario.

Cordialmente,

{{firmante_nombre}}
{{firmante_cargo}}
{{razon_social}}
