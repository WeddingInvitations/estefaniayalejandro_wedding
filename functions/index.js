const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const SibApiV3Sdk = require("@sendinblue/client");
const XLSX = require("xlsx");

admin.initializeApp();

// Configurar Brevo/Sendinblue
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY || "your-api-key-here";

exports.enviarEmail = onRequest({cors: true}, async (req, res) => {
  logger.info("Iniciando envío de email...", {structuredData: true});
  logger.info("Request body:", JSON.stringify(req.body, null, 2));

  const {nm, ph, att, ale, song, dri, gue} = req.body;

  // Validar datos mínimos necesarios
  if (!nm || !ph) {
    logger.warn("Datos incompletos:", req.body);
    return res.status(400).json({message: "Faltan datos obligatorios"});
  }

  let bebidaAlcoholica = "";
  if (!dri) {
    bebidaAlcoholica = "No";
  } else {
    bebidaAlcoholica = "Si";
  }

  // Visualizacion principal, en caso de bloqueo, usara la de texto
  let html = `<strong>Nombre:</strong> ${nm}<br>`;
  html += `<strong>Teléfono:</strong> ${ph}<br>`;
  html += `<strong>Alergias:</strong> ${ale}<br>`;
  html += `<strong>Canción:</strong> ${song}<br><br>`;
  html += `<strong>Bebida alcoholica:</strong> ${bebidaAlcoholica}<br>`;

  // Fallback, por si acaso se bloquea la visualizacion html
  let text = `Nombre:${nm}\n`;
  text += `Teléfono:${ph}\n`;
  text += `Alergias:${ale}\n`;
  text += `Canción: ${song}\n\n`;
  text += `Bebida alcoholica: ${bebidaAlcoholica}\n\n`;


  if (!att) {
    text += "Acompañantes: No voy acompañado\n";
    html += "<strong>Acompañantes:</strong> No voy acompañado<br>";
  } else {
    html += "<strong>Acompañantes:</strong><br><ul>";
    gue.forEach((acompanante, index) => {
      const edadMenor = acompanante.Edad ? ` - Edad: ${acompanante.Edad}` : "";
      html += `<li>Acompañante ${index + 1}:`;
      html += `<ul>`;
      html += `<li>Nombre: ${acompanante.Nombre}</li>`;
      html += `<li>Tipo: ${acompanante.TipoInvitado}${edadMenor}</li>`;
      html += `<li>Alergias: ${acompanante.Alergias}</li>`;
      html += `<li>Cancion: ${acompanante.Cancion}</li>`;
      html += `<li>Bebida alcoholica: ${acompanante.Alcohol}</li>`;
      html += `</ul></li>`;
    });
    html += `</ul>`;

    text += "Acompañantes:\n";
    gue.forEach((acompanante, index) => {
      const edadMenor = acompanante.Edad ? ` - Edad: ${acompanante.Edad}` : "";
      text += `--- Acompañante ${index + 1} ---\n`;
      text += `* Nombre: ${acompanante.Nombre}\n`;
      text += `* Tipo: ${acompanante.TipoInvitado}${edadMenor}\n`;
      text += `* Alergias: ${acompanante.Alergias}\n`;
      text += `* Cancion: ${acompanante.Cancion}\n`;
      text += `* Bebida alcoholica: ${acompanante.Alcohol}\n\n`;
    });
  }

  const email1 = "estefaniagarciaperezdeguzman@gmail.com";
  // const email1 = "f14agui@gmail.com";
  const email2 = "alexcampillo10@gmail.com";

  // Crear el email para Brevo
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: "Boda Estefanía y Alejandro",
    email: "weddinginvitationscampfire@gmail.com", // Email más confiable
  };
  sendSmtpEmail.to = [
    {email: email1, name: "Estefanía y Alejandro"},
    {email: email2, name: "Estefanía y Alejandro"},
  ];
  sendSmtpEmail.subject = "Nueva asistencia registrada";
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.textContent = text;

  logger.info("Datos del email a enviar:", JSON.stringify(sendSmtpEmail, null, 2));

  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  try {
    logger.info("Intentando enviar email con Brevo...");
    logger.info("API Instance:", apiInstance);
    logger.info("API Key configurado:", apiKey.apiKey ? "SÍ" : "NO");

    // Enviar email con Brevo
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info("Email enviado exitosamente:", JSON.stringify(result, null, 2));
    res.status(200).json({message: "Notificación OK", messageId: result.messageId});
  } catch (error) {
    logger.error("Error enviando email:", error);
    logger.error("Error response:", error.response ? error.response.data : "No response data");
    logger.error("Error status:", error.response ? error.response.status : "No status");
    res.status(500).json({
      error: "Error enviando notificación",
      details: error.message,
      brevoError: error.response ? error.response.data : null,
    });
  }
});

// Nueva función para exportar invitados a Excel
exports.exportarInvitados = onRequest({cors: true}, async (req, res) => {
  logger.info("Iniciando exportación de invitados a Excel...");

  try {
    // Obtener todos los documentos de la colección attendance
    const db = admin.firestore();
    const snapshot = await db.collection("attendance").get();

    if (snapshot.empty) {
      return res.status(404).json({message: "No hay invitados registrados"});
    }

    const invitados = [];
    let numeroFila = 1;

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Invitado principal
      const invitadoPrincipal = {
        "Nº": numeroFila++,
        "ID Documento": doc.id,
        "Tipo": "Principal",
        "Nombre": data.Nombre || "",
        "Teléfono": data.Teléfono || "",
        "Alergias": data.Alergias || "Sin alergias",
        "Canción": data.Cancion || "",
        "Bebida alcoholica": data.Bebida? "SI" : "NO",
        // "Transporte": data.Bus ? "SÍ" : "NO",
        "Tiene Acompañantes": data.Asistencia ? "SI" : "NO",
        "Fecha Registro": data.timestamp ? new Date(data.timestamp).toLocaleDateString("es-ES") : "",
      };

      invitados.push(invitadoPrincipal);

      // Acompañantes (si los hay)
      if (data.Asistencia && data.Acompañantes && Array.isArray(data.Acompañantes)) {
        data.Acompañantes.forEach((acompanante, index) => {
          const acompananteData = {
            "Nº": numeroFila++,
            "ID Documento": doc.id,
            "Tipo": `Acompañante ${index + 1}`,
            "Nombre": acompanante.Nombre || "",
            "Teléfono": data.Teléfono || "", // Mismo teléfono que el principal
            "Alergias": acompanante.Alergias || "Sin alergias",
            "Canción": acompanante.Cancion || "",
            "Bebida alcoholica": acompanante.Alcohol || "",
            "Tiene Acompañantes": "N/A",
            "Fecha Registro": data.timestamp ? new Date(data.timestamp).toLocaleDateString("es-ES") : "",
          };

          invitados.push(acompananteData);
        });
      }
    });

    // Crear el libro de Excel
    const workbook = XLSX.utils.book_new();

    // Crear la hoja con los datos
    const worksheet = XLSX.utils.json_to_sheet(invitados);

    // Configurar el ancho de las columnas
    const columnWidths = [
      {wch: 5}, // Nº
      {wch: 20}, // ID Documento
      {wch: 15}, // Tipo
      {wch: 25}, // Nombre
      {wch: 15}, // Teléfono
      {wch: 20}, // Alergias
      {wch: 25}, // Cancion
      {wch: 15}, // Bebida
      // {wch: 12}, // Transporte
      {wch: 18}, // Tiene Acompañantes
      {wch: 15}, // Fecha Registro
    ];

    worksheet["!cols"] = columnWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invitados Boda");

    // Crear el buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, {type: "buffer", bookType: "xlsx"});

    // Configurar headers para descarga
    const fechaActual = new Date().toISOString().split("T")[0];
    const nombreArchivo = `Invitados_Boda_Estefania_y_Alejandro_${fechaActual}.xlsx`;

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    logger.info(`Excel generado exitosamente con ${invitados.length} registros`);
    res.send(excelBuffer);
  } catch (error) {
    logger.error("Error exportando invitados:", error);
    res.status(500).json({
      error: "Error exportando invitados",
      details: error.message,
    });
  }
});
