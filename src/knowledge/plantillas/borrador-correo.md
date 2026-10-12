Para: {{para}}
Asunto: {{asunto}}

Buenos días, equipo de {{cliente}}:

Adjuntamos el formulario de registro como proveedor ({{formulario}}) firmado por el representante legal, junto con los siguientes soportes:

{{#soportes_adjuntos}}- {{tipo}} ({{archivo}})
{{/soportes_adjuntos}}{{^soportes_adjuntos}}- Ninguno por ahora.
{{/soportes_adjuntos}}
{{#hay_pendientes}}Quedan pendientes:
{{/hay_pendientes}}{{#pendientes}}- {{texto}}
{{/pendientes}}{{#hay_pendientes}}Los enviaremos por separado.

{{/hay_pendientes}}Quedamos atentos a cualquier comentario.

Cordialmente,

{{firmante_nombre}}
{{firmante_cargo}}
{{razon_social}}
