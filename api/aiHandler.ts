import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * AI Business Assistant Handler
 */
export async function handleAIAssistant(prompt: string, contextData: any, language: 'en' | 'bn' = 'en') {
  const ai = getAIClient();
  if (!ai) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured. Please configure it in Settings > Secrets.',
      reply: language === 'bn' 
        ? 'জেমিনাই এআই কনফিগার করা নেই। অনুগ্রহ করে সিক্রেটস প্যানেল চেক করুন।'
        : 'Gemini AI is not configured. Please check your AI Studio secrets.',
    };
  }

  const systemInstruction = `
You are the expert business intelligence assistant for "MediEasy", a pharmacy management system in Bangladesh.
Language instruction: Answer strictly in ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}.
CRITICAL BOUNDARIES:
- Ground all numerical answers strictly in the provided current database context.
- Never invent revenue, stock, or sales figures. If data is not in the context, explicitly say so.
- Currency is Bangladeshi Taka (৳ BDT).
- Do NOT provide medical diagnosis or replace a licensed doctor/pharmacist. Focus on pharmacy business operations, inventory, sales, low stock alerts, supplier reorders, and profitability.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Pharmacy Database State Context:\n${JSON.stringify(contextData, null, 2)}` },
            { text: `User Question:\n${prompt}` },
          ],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return {
      success: true,
      reply: response.text || (language === 'bn' ? 'কোনো উত্তর পাওয়া যায়নি।' : 'No response generated.'),
    };
  } catch (err: any) {
    console.error('AI Assistant Error:', err);
    return {
      success: false,
      error: err.message,
      reply: language === 'bn' ? `ত্রুটি ঘটেছে: ${err.message}` : `Error: ${err.message}`,
    };
  }
}

/**
 * AI Invoice Scanner Handler (Multimodal Vision)
 */
export async function handleScanInvoice(base64Image: string, mimeType: string = 'image/jpeg') {
  const ai = getAIClient();
  if (!ai) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured.',
    };
  }

  const systemPrompt = `
You are an expert OCR and invoice parsing engine specialized in Bangladeshi pharmaceutical invoices (e.g., Square Pharmaceuticals, Beximco, Incepta, Renata, ACME, Eskayef).
Carefully inspect the invoice image and extract structured purchase invoice details.
Extract:
- supplierName: Company/Distributor name
- invoiceNo: Invoice or memo number
- invoiceDate: Date in YYYY-MM-DD format if readable, else empty
- totalAmount: Total invoice amount in BDT
- items: list of medicines containing:
  - medicineName: Name of medicine/brand
  - strength: e.g. 500mg, 20mg, 10ml
  - batchNumber: Batch/Lot number
  - expiryDate: Expiry date in YYYY-MM-DD
  - quantity: Number of packs/units received
  - unitPrice: Trade purchase price per unit
  - lineTotal: Line total amount
`;

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: systemPrompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            invoiceNo: { type: Type.STRING },
            invoiceDate: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  medicineName: { type: Type.STRING },
                  strength: { type: Type.STRING },
                  batchNumber: { type: Type.STRING },
                  expiryDate: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  lineTotal: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return {
      success: true,
      data: parsedData,
    };
  } catch (err: any) {
    console.error('Invoice OCR Scanner Error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * AI Stock Forecasting and Slow-Moving Analysis
 */
export async function handleStockForecast(inventoryData: any, salesHistory: any, language: 'en' | 'bn' = 'en') {
  const ai = getAIClient();
  if (!ai) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured.',
    };
  }

  const prompt = `
Analyze the following pharmacy inventory and sales data.
Provide an intelligent inventory reordering and stock velocity forecast.
Identify:
1. Fast-moving medicines with estimated days of stock remaining and recommended reorder quantities.
2. Slow-moving items or capital tied up in excess stock.
3. Batches requiring immediate action or return to supplier.
Format the recommendations clearly in ${language === 'bn' ? 'Bangla (বাংলা)' : 'English'}.
Inventory:
${JSON.stringify(inventoryData)}
Sales:
${JSON.stringify(salesHistory)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return {
      success: true,
      forecast: response.text,
    };
  } catch (err: any) {
    console.error('Stock Forecast Error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}
