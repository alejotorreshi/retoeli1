# Checklist del paquete para firma: {{caso}}

Cliente: {{cliente}}
Fecha de ejecución: {{fecha_ejecucion}}
Estado: {{estado}}
{{#motivos}}- {{motivo}}
{{/motivos}}
## Soportes

| Soporte | Archivo | Vigencia | Estado | Aviso | País emisor | Aviso de emisor |
|------|---------|----------|--------|-------|-------------|-----------------|
{{#soportes}}| {{nombre}} | {{archivo}} | {{vigencia}} | {{estado}} | {{aviso}} | {{pais_emisor}} | {{aviso_emisor}} |
{{/soportes}}
## Campos faltantes

{{#faltantes}}- {{etiqueta}}: no existe en el maestro
{{/faltantes}}{{^faltantes}}Ninguno.
{{/faltantes}}
## Campos por confirmar

{{#por_confirmar}}- {{etiqueta}}: {{nota}}
{{/por_confirmar}}{{^por_confirmar}}Ninguno.
{{/por_confirmar}}
## Acciones

{{#ausentes}}- [ ] Conseguir el soporte {{nombre}} y agregarlo al paquete
{{/ausentes}}{{#vencidos}}- [ ] Renovar el soporte {{nombre}}, vencido desde {{vigencia}}
{{/vencidos}}{{#faltantes}}- [ ] Conseguir el dato "{{etiqueta}}" y completarlo en el formulario
{{/faltantes}}{{#por_confirmar}}- [ ] Confirmar con el cliente el campo "{{etiqueta}}"
{{/por_confirmar}}{{#con_aviso_emisor}}- [ ] Confirmar con el cliente si acepta el soporte {{nombre}}, emitido en {{pais_emisor}}
{{/con_aviso_emisor}}- [ ] Revisar el formulario y pasarlo a firma del representante legal
