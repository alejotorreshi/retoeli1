Para: {{para}}
Asunto: {{asunto}}

Buenos días, equipo de {{cliente}}:

{{#adjunta_formulario}}Adjuntamos el formulario de registro como proveedor ({{formulario}}) y los siguientes soportes:
{{/adjunta_formulario}}{{^adjunta_formulario}}El formulario de registro como proveedor se diligencia en su portal. Adjuntamos los siguientes soportes:
{{/adjunta_formulario}}
{{#soportes_adjuntos}}- {{nombre}} ({{archivo}})
{{/soportes_adjuntos}}{{^soportes_adjuntos}}- Ninguno por ahora.
{{/soportes_adjuntos}}
{{#hay_por_confirmar}}Antes de la firma necesitamos que nos confirmen estos campos:
{{/hay_por_confirmar}}{{#por_confirmar}}- {{etiqueta}}: {{nota}}
{{/por_confirmar}}{{#hay_por_confirmar}}
{{/hay_por_confirmar}}{{#hay_pendientes}}Quedan pendientes:
{{/hay_pendientes}}{{#pendientes}}- {{texto}}
{{/pendientes}}{{#hay_pendientes}}Los enviaremos por separado.

{{/hay_pendientes}}{{#firma_lista}}El formulario queda listo para la firma de nuestro representante legal.

{{/firma_lista}}{{#firma_tras_confirmar}}Con su confirmación pasaremos el formulario a la firma de nuestro representante legal.

{{/firma_tras_confirmar}}{{#firma_bloqueada}}El formulario todavía no está listo para la firma de nuestro representante legal: falta completar los pendientes indicados.

{{/firma_bloqueada}}Quedamos atentos a cualquier comentario.

Cordialmente,

{{firmante_nombre}}
{{firmante_cargo}}
{{razon_social}}
