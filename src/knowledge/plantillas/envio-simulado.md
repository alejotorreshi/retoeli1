# Envío simulado: {{caso}}

Cliente: {{cliente}}
Destinatario: {{destinatario}}
Asunto: {{asunto}}
Fecha de ejecución: {{fecha_ejecucion}}

No se envió ningún correo real: este archivo solo registra el envío simulado del paquete.

## Archivos que se envían

{{#formulario_en_portal}}El formulario se diligencia en el portal del cliente: paquete/{{formulario}} queda como guía de valores para la analista y no se envía.

{{/formulario_en_portal}}{{#archivos}}- paquete/{{archivo}}
{{/archivos}}{{^archivos}}Ninguno.
{{/archivos}}
## Soportes vencidos que no se envían

Quedan en el paquete como referencia para la firma, pero no salen al cliente hasta tener la versión actualizada.

{{#retenidos}}- paquete/{{archivo}}
{{/retenidos}}{{^retenidos}}Ninguno.
{{/retenidos}}
## Bloqueos vigentes al confirmar

{{#bloqueos}}- {{bloqueo}}
{{/bloqueos}}{{^bloqueos}}Sin bloqueos.
{{/bloqueos}}
## Confirmación

Confirmado explícitamente por la usuaria en la conversación antes de registrar este envío.
