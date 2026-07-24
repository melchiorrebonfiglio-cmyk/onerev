import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

// Helper to extract a friendly error message from Gemini API errors
function getFriendlyErrorMessage(err: any): string {
  if (!err) return "Errore sconosciuto";
  if (typeof err === "string") return err;
  
  let message = err.message || "";
  
  // If the message is a JSON string or contains a JSON block
  if (message.includes("{")) {
    try {
      const startIdx = message.indexOf("{");
      const endIdx = message.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = message.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed.error && parsed.error.message) {
          return parsed.error.message;
        }
      }
    } catch (_) {}
  }
  return message || "Errore sconosciuto durante la chiamata a Gemini";
}

// Helper to handle fallback to other Gemini models if the primary model is rate-limited or fails
async function generateContentWithFallback(ai: any, params: {
  contents: any;
  config: any;
}) {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[Gemini Fallback System] Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config,
      });

      if (response && response.text) {
        console.log(`[Gemini Fallback System] Succeeded with model: ${model}`);
        return response;
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback System] Model ${model} failed:`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(getFriendlyErrorMessage(lastError));
}

const app = express();

// Limit body size for base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API route for extracting material list from image
app.post("/api/gemini/extract-materials", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Nessuna immagine fornita (imageBase64 mancante)" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "La chiave API GEMINI_API_KEY non è configurata sul server." });
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const promptString = `Estrai le informazioni dall'intestazione e dall'ordine di prenotazione della lista materiali presente nell'immagine.
Genera una tabella con i seguenti campi per ciascun articolo/materiale trovato:
- codice (es. codice materiale, codice articolo)
- descrizione (nome o descrizione del materiale)
- quantita (quantità prenotata o ordinata)

Inoltre fornisci un testo riassuntivo (rawText) che contenga i dettagli principali dell'intestazione dell'ordine (es. Numero Ordine, Data, Cantiere, Cliente). Rispondi esclusivamente in italiano.`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    };

    const textPart = {
      text: promptString,
    };

    const response = await generateContentWithFallback(ai, {
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rawText: {
              type: Type.STRING,
              description: "Dettagli principali estratti dall'intestazione dell'ordine di prenotazione (es. Numero ordine, data, cliente)."
            },
            table: {
              type: Type.ARRAY,
              description: "Lista degli articoli/materiali presenti nell'ordine.",
              items: {
                type: Type.OBJECT,
                properties: {
                  codice: { type: Type.STRING, description: "Codice del materiale o dell'articolo." },
                  descrizione: { type: Type.STRING, description: "Descrizione o nome del materiale." },
                  quantita: { type: Type.STRING, description: "Quantità del materiale." }
                },
                required: ["codice", "descrizione", "quantita"]
              }
            }
          },
          required: ["rawText", "table"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Nessuna risposta ricevuta da Gemini API");
    }

    const parsedResult = JSON.parse(resultText);
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Errore durante l'estrazione della lista materiali" });
  }
});

// API route for extracting project, site A/Z or service data from images
app.post("/api/gemini/extract-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", type } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Nessuna immagine fornita (imageBase64 mancante)" });
    }
    if (!type || !["ordine", "sito", "servizio"].includes(type)) {
      return res.status(400).json({ error: "Tipo di estrazione non valido o mancante" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "La chiave API GEMINI_API_KEY non è configurata sul server." });
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let promptString = "";
    let responseSchema: any = {};

    if (type === "ordine") {
      promptString = `Sei un assistente esperto in telecomunicazioni. Estrai i dati dell'ordine da questa immagine in lingua italiana. Cerca di individuare i seguenti campi:
- idOdf (corrisponde a 'ID ODF', 'Odf', o id odf dell'ordine)
- idOrdine (corrisponde a 'ID Ordine', 'Numero Ordine', 'Codice Ordine', 'CRQ', 'ID_ORDINE', o un identificativo numerico dell'ordine principale)
- tipo (corrisponde a 'Tipo', 'Tipologia', 'Tipo Ordine', 'Tipologia Ordine' ad esempio 'Nuova Attivazione', 'Cessazione', 'Trasloco', o simili)

Se un campo non viene trovato nell'immagine o è vuoto, usa 'N/A' come valore di default.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          idOdf: { type: Type.STRING, description: "ID ODF dell'ordine" },
          idOrdine: { type: Type.STRING, description: "ID Ordine, Numero Ordine o CRQ" },
          tipo: { type: Type.STRING, description: "Tipo di ordine (es. Nuova Attivazione)" }
        },
        required: ["idOdf", "idOrdine", "tipo"]
      };
    } else if (type === "sito") {
      promptString = `Sei un assistente esperto in telecomunicazioni. Estrai i dati del sito da questa immagine in lingua italiana. Identifica con precisione i seguenti campi basandoti sulle etichette visibili nell'immagine:
- tipologiaSito (corrisponde a 'Tipologia Sito', ad esempio 'ColocationCustomerSite', 'CustomerSite', 'POP')
- indirizzo (corrisponde a 'Indirizzo', via, piazza, corso ecc. ad esempio 'VIA DELLA SALUTE,14/2')
- citta (corrisponde a 'Città' o 'Comune' o 'Località', ad esempio 'BOLOGNA')
- acronimo (corrisponde a 'Acronimo' o 'Codice Sito', ad esempio 'BODLLS30')
- riferimentoCliente (corrisponde al contatto cliente o la ragione sociale / Owner del sito. Se presente un referente cliente specifico es. 'Marilia Faraone' o un Owner/Ragione Sociale es. 'Skandinaviska Enskilda Banken AB (SEB Airplus...)', estrai il valore più descrittivo o l'Owner)
- telefono (corrisponde a 'Telefono' o 'Tel' o recapito telefonico, ad esempio '0514389303')
- email (corrisponde a 'Email' o 'E-mail', ad esempio 'mfaraone@airplus.com')
- interfaccia (corrisponde a 'Interfaccia' o tipo di porta/connessione, ad esempio '1000 Base LX-LC')

Se un campo non viene trovato nell'immagine o è vuoto, usa 'N/A' come valore di default.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          tipologiaSito: { type: Type.STRING, description: "Tipologia del sito" },
          indirizzo: { type: Type.STRING, description: "Indirizzo del sito (via, n. civico)" },
          citta: { type: Type.STRING, description: "Città del sito" },
          acronimo: { type: Type.STRING, description: "Acronimo o codice del sito" },
          riferimentoCliente: { type: Type.STRING, description: "Referente cliente o owner del sito" },
          telefono: { type: Type.STRING, description: "Telefono di contatto" },
          email: { type: Type.STRING, description: "Email di contatto" },
          interfaccia: { type: Type.STRING, description: "Interfaccia o porta del sito" }
        },
        required: ["tipologiaSito", "indirizzo", "citta", "acronimo", "riferimentoCliente", "telefono", "email", "interfaccia"]
      };
    } else if (type === "servizio") {
      promptString = `Sei un assistente esperto in telecomunicazioni. Estrai i dati del servizio da questa immagine in lingua italiana. Identifica i seguenti campi:
- cpe (corrisponde a 'CPE', 'Router' o apparato)
- banda (corrisponde a 'Banda' o 'Velocità')
- noteIngaggio (corrisponde a 'Note per l'ingaggio' o note aggiuntive dell'ordine)

Se un campo non viene trovato nell'immagine o è vuoto, usa 'N/A' o una stringa vuota per le note di ingaggio.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          cpe: { type: Type.STRING, description: "Apparato CPE o Router" },
          banda: { type: Type.STRING, description: "Banda o profilo di velocità" },
          noteIngaggio: { type: Type.STRING, description: "Note aggiuntive per l'ingaggio" }
        },
        required: ["cpe", "banda", "noteIngaggio"]
      };
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    };

    const textPart = {
      text: promptString,
    };

    const response = await generateContentWithFallback(ai, {
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Nessuna risposta ricevuta da Gemini API");
    }

    const parsedResult = JSON.parse(resultText);
    return res.json(parsedResult);

  } catch (error: any) {
    console.error("Gemini Image Extraction Error:", error);
    return res.status(500).json({ error: error.message || "Errore durante l'estrazione dei dati dall'immagine" });
  }
});

export default app;
