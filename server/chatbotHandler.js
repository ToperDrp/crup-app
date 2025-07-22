const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// --- Gemini API Configuration ---
// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_HOST = 'generativelanguage.googleapis.com';
const GEMINI_API_PATH = '/v1beta/models/gemini-2.0-flash:generateContent';

// --- Buffet Prices ---
const BUFFET_PRICES = {
  "standard": 299,
  "premium": 399,
  "vip": 599
};

// --- System Instruction for Gemini ---
const systemInstruction = `
  You are a highly intelligent and friendly AI assistant for a restaurant's sales management system.
  Your primary goal is to understand user requests in natural language (especially Thai) and convert them into structured JSON commands.
  You must be flexible, infer user intent, and handle incomplete information gracefully.
  Always respond in Thai.
  Today's date is ${new Date().toISOString().slice(0, 10)}.

  **Price List (Buffet Type: Price per Person):**
  - Standard: 299
  - Premium: 399
  - VIP: 599

  **Core Actions:**

  1.  **GET_SALES:** Retrieve sales data.
      - **User phrases:** "แสดงยอดขาย", "ดูข้อมูลการขาย", "ยอดขายทั้งหมด"
      - **JSON:** { "action": "GET_SALES" }

  2.  **ANALYZE_SALES:** Analyze sales data for a specific period.
      - **User phrases:** "สรุปยอดขายเดือนนี้", "ยอดขายวันนี้", "ยอดขายสัปดาห์ที่แล้ว"
      - **Date Inference:** You MUST infer the 'startDate' and 'endDate' from phrases like "วันนี้", "เมื่อวาน", "สัปดาห์นี้", "เดือนนี้", "ปีนี้".
      - **JSON:** { "action": "ANALYZE_SALES", "parameters": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" } }

  3.  **ADD_SALE:** Add a new sale record.
      - **User phrases:** "เพิ่มยอดขาย", "บันทึกการขาย", "โต๊ะ 5 มา 4 คน"
      - **Parameter Inference:**
          - **Crucially, if the user mentions a 'buffetType' (e.g., "พรีเมียม"), you MUST find its price in the 'Price List' above and use it for the 'pricePerPerson' parameter.**
          - If the user only provides a day (e.g., "วันที่ 22"), infer the full date using today's date.
          - It's OK if some parameters are missing. The application will ask the user for them. Your job is to identify the *intent* to add a sale and extract what you can.
      - **JSON:** { "action": "ADD_SALE", "parameters": { "date": "YYYY-MM-DD", "tableNumber": INT, "customerCount": INT, "buffetType": "VARCHAR", "pricePerPerson": INT, "paymentMethod": "VARCHAR" } }

  4.  **UPDATE_SALE:** Initiate an update for an existing sale.
      - **User phrases:** "แก้ไขบิล ID 5", "อัปเดตโต๊ะ 3"
      - **JSON:** { "action": "UPDATE_SALE", "parameters": { "id": INT, "updates": { "field": "newValue" } } }

  5.  **DELETE_SALE:** Initiate a deletion for an existing sale.
      - **User phrases:** "ลบบิล 10", "ยกเลิกรายการขายที่ 2"
      - **JSON:** { "action": "DELETE_SALE", "parameters": { "id": INT } }

  **General Rules:**

  - Your response MUST ALWAYS be a single, valid JSON object.
  - If the user's intent is unclear, use { "action": "UNKNOWN", "reply": "ขออภัยค่ะ ฉันไม่เข้าใจว่าคุณต้องการให้ทำอะไร ช่วยอธิบายอีกครั้งได้ไหมคะ" }.
  - For general greetings or unrelated questions, use { "action": "GENERAL_QUERY", "reply": "สวัสดีค่ะ! ฉันเป็นผู้ช่วยจัดการร้านอาหาร มีอะไรให้ช่วยไหมคะ" }.
`;

// --- Helper Functions ---

async function callGeminiApi(userMessage) {
  const requestBody = {
    contents: [{
      parts: [{ text: systemInstruction + "\n\nUser: " + userMessage }]
    }]
  };

  const reqUrl = `https://${GEMINI_API_HOST}${GEMINI_API_PATH}?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(reqUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API HTTP error! Status: ${response.status}, Message: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
      // Clean the response to get only the JSON part
      const rawText = data.candidates[0].content.parts[0].text;
      const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
      return jsonMatch ? jsonMatch[1] : rawText;
    } else {
      throw new Error('Gemini API returned an unexpected response structure.');
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error; // Re-throw the error to be caught by the main handler
  }
}

function getMissingFields(params) {
    const required = ["date", "tableNumber", "customerCount", "buffetType", "pricePerPerson", "paymentMethod"];
    return required.filter(field => !params[field]);
}

function translateFields(fieldName) {
    const translations = {
        date: "วันที่",
        tableNumber: "หมายเลขโต๊ะ",
        customerCount: "จำนวนลูกค้า",
        buffetType: "ประเภทบุฟเฟต์",
        pricePerPerson: "ราคาต่อคน",
        paymentMethod: "วิธีการชำระเงิน"
    };
    return translations[fieldName] || fieldName;
}


// --- Main Chatbot Logic ---

module.exports = function(app, pool, port) {
  let conversationState = {}; // Stores context for multi-step interactions

  app.post('/api/chatbot', async (req, res) => {
    const { message, userId } = req.body; // Assuming userId is sent from frontend
    const stateKey = userId || 'default'; // Use userId to manage separate conversations
    let currentState = conversationState[stateKey] || {};

    console.log(`[${stateKey}] Received message:`, message);
    console.log(`[${stateKey}] Current state:`, currentState);

    try {
        // --- Handle ongoing conversations ---
        if (currentState.pendingAction) {
            let botReply = '';
            // User is confirming an action (ADD, UPDATE, DELETE)
            if (currentState.pendingAction.endsWith('_CONFIRMATION')) {
                const confirmation = message.toLowerCase();
                if (confirmation.startsWith('ใช่') || confirmation.startsWith('yes')) {
                    const { action, data } = currentState;
                    let apiResponse;
                    try {
                        switch (action) {
                            case 'ADD_SALE':
                                const totalAmount = data.customerCount * data.pricePerPerson;
                                apiResponse = await fetch(`http://localhost:${port}/api/sales`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ...data, totalAmount })
                                });
                                const result = await apiResponse.json();
                                botReply = `เพิ่มรายการขาย ID ${result.id} เรียบร้อยแล้วค่ะ`;
                                break;
                            case 'UPDATE_SALE':
                                apiResponse = await fetch(`http://localhost:${port}/api/sales/${data.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data.updates)
                                });
                                botReply = `อัปเดตรายการขาย ID ${data.id} เรียบร้อยแล้วค่ะ`;
                                break;
                            case 'DELETE_SALE':
                                apiResponse = await fetch(`http://localhost:${port}/api/sales/${data.id}`, { method: 'DELETE' });
                                botReply = `ลบรายการขาย ID ${data.id} เรียบร้อยแล้วค่ะ`;
                                break;
                        }
                        if (!apiResponse.ok) {
                           botReply = `เกิดข้อผิดพลาด: ${await apiResponse.text()}`;
                        }
                    } catch (error) {
                        console.error(`Error during confirmed action ${action}:`, error);
                        botReply = 'ขออภัยค่ะ เกิดข้อผิดพลาดในการดำเนินการ';
                    }
                } else {
                    botReply = 'ยกเลิกการดำเนินการแล้วค่ะ';
                }
                conversationState[stateKey] = {}; // Clear state
                return res.json({ reply: botReply });
            }

            // User is providing missing information for ADD_SALE
            if (currentState.pendingAction === 'ADD_SALE_MISSING_INFO') {
                const missingField = currentState.missingFields[0]; // Get the first missing field

                const isNumericField = ['pricePerPerson', 'tableNumber', 'customerCount'].includes(missingField);
                const receivedValue = isNumericField ? parseInt(message, 10) : message;

                if (isNumericField && isNaN(receivedValue)) {
                    botReply = `ขออภัยค่ะ ฉันคาดหวังตัวเลขสำหรับ ${translateFields(missingField)} แต่ได้รับข้อความที่ไม่ใช่ตัวเลข กรุณาลองอีกครั้งค่ะ`;
                    conversationState[stateKey] = currentState;
                } else {
                    // Update the correct field in the data object
                    currentState.data[missingField] = receivedValue;

                    // **NEW LOGIC**: If buffetType was just provided, try to infer price.
                    if (missingField === 'buffetType' && currentState.data.buffetType) {
                        const price = BUFFET_PRICES[currentState.data.buffetType.toLowerCase()];
                        if (price) {
                            currentState.data.pricePerPerson = price;
                        }
                    }

                    // Re-validate to see if anything else is missing
                    const stillMissingFields = getMissingFields(currentState.data);
                    currentState.missingFields = stillMissingFields;

                    if (stillMissingFields.length > 0) {
                        botReply = `ขอบคุณค่ะ ยังขาดข้อมูล: ${stillMissingFields.map(translateFields).join(', ')} ค่ะ`;
                        conversationState[stateKey] = currentState;
                    } else {
                        // All information is now present, proceed to confirmation
                        const { data } = currentState;
                        const totalAmount = data.customerCount * data.pricePerPerson;
                        botReply = `รับทราบค่ะ: วันที่ ${data.date}, โต๊ะ ${data.tableNumber}, ${data.customerCount} ท่าน, บุฟเฟ่ต์ ${data.buffetType} (ราคา ${data.pricePerPerson} บาท/ท่าน), ชำระเงินด้วย ${data.paymentMethod} รวมเป็นเงิน ${totalAmount} บาท ถูกต้องไหมคะ? (ใช่/ไม่)`;
                        conversationState[stateKey] = { pendingAction: 'ADD_SALE_CONFIRMATION', action: 'ADD_SALE', data };
                    }
                }
                return res.json({ reply: botReply });
            }
        }


      // --- Process new messages with Gemini ---
      const geminiResponseText = await callGeminiApi(message);
      const geminiResponse = JSON.parse(geminiResponseText);

      console.log(`[${stateKey}] Gemini response:`, geminiResponse);

      let botReply = '';
      let salesData = null;

      switch (geminiResponse.action) {
        case 'GET_SALES':
          const salesResponse = await fetch(`http://localhost:${port}/api/sales`);
          salesData = await salesResponse.json();
          if (salesData && salesData.length > 0) {
            let tableHeader = "ID | Date       | Table | Cust | Buffet   | Price/P | Payment  | Total\n";
            tableHeader += "---|------------|-------|------|----------|---------|----------|-------\n";
            let tableRows = salesData.map(s =>
                `${String(s.id).padEnd(2)} | ${s.date} | ${String(s.tableNumber).padEnd(5)} | ${String(s.customerCount).padEnd(4)} | ${String(s.buffetType).padEnd(8)} | ${String(s.pricePerPerson).padEnd(7)} | ${String(s.paymentMethod).padEnd(8)} | ${s.totalAmount}`
            ).join('\n');
            botReply = 'นี่คือข้อมูลการขายทั้งหมดค่ะ:\n```\n' + tableHeader + tableRows + '\n```';
          } else {
            botReply = 'ไม่พบข้อมูลการขายค่ะ';
          }
          break;

        case 'ANALYZE_SALES':
            const { startDate, endDate } = geminiResponse.parameters;
            const analysisResponse = await fetch(`http://localhost:${port}/api/sales?startDate=${startDate}&endDate=${endDate}`);
            salesData = await analysisResponse.json();
            if (salesData && salesData.length > 0) {
                const totalRevenue = salesData.reduce((sum, s) => sum + s.totalAmount, 0);
                const totalCustomers = salesData.reduce((sum, s) => sum + s.customerCount, 0);
                botReply = `สรุปยอดขายระหว่างวันที่ ${startDate} ถึง ${endDate}:\n- จำนวนบิล: ${salesData.length} บิล\n- จำนวนลูกค้าทั้งหมด: ${totalCustomers} ท่าน\n- ยอดขายรวม: ${totalRevenue.toLocaleString()} บาท`;
            } else {
                botReply = `ไม่พบข้อมูลการขายในช่วงวันที่ ${startDate} ถึง ${endDate} ค่ะ`;
            }
            break;

        case 'ADD_SALE':
            let params = geminiResponse.parameters;
            // Auto-fill price if buffetType is known
            if (params.buffetType && !params.pricePerPerson) {
                params.pricePerPerson = BUFFET_PRICES[params.buffetType.toLowerCase()];
            }
            const missingFields = getMissingFields(params);
            if (missingFields.length > 0) {
                botReply = `ได้เลยค่ะ แต่ยังขาดข้อมูล: ${missingFields.map(translateFields).join(', ')} ค่ะ`;
                conversationState[stateKey] = { pendingAction: 'ADD_SALE_MISSING_INFO', data: params, missingFields };
            } else {
                const totalAmount = params.customerCount * params.pricePerPerson;
                botReply = `รับทราบค่ะ: วันที่ ${params.date}, โต๊ะ ${params.tableNumber}, ${params.customerCount} ท่าน, บุฟเฟ่ต์ ${params.buffetType} (ราคา ${params.pricePerPerson} บาท/ท่าน), ชำระเงินด้วย ${params.paymentMethod} รวมเป็นเงิน ${totalAmount} บาท ถูกต้องไหมคะ? (ใช่/ไม่)`;
                conversationState[stateKey] = { pendingAction: 'ADD_SALE_CONFIRMATION', action: 'ADD_SALE', data: params };
            }
            break;

        case 'UPDATE_SALE':
            botReply = `คุณต้องการจะอัปเดตข้อมูลสำหรับบิล ID ${geminiResponse.parameters.id} ใช่ไหมคะ? กรุณาระบุข้อมูลที่ต้องการแก้ไขค่ะ (เช่น "เปลี่ยนเป็นโต๊ะ 5" หรือ "ลูกค้าเป็น 3 คน")`;
            conversationState[stateKey] = { pendingAction: 'UPDATE_SALE_CONFIRMATION', action: 'UPDATE_SALE', data: geminiResponse.parameters };
            break;

        case 'DELETE_SALE':
            botReply = `คุณยืนยันที่จะลบรายการขาย ID ${geminiResponse.parameters.id} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ค่ะ (ใช่/ไม่)`;
            conversationState[stateKey] = { pendingAction: 'DELETE_SALE_CONFIRMATION', action: 'DELETE_SALE', data: geminiResponse.parameters };
            break;

        case 'GENERAL_QUERY':
        case 'UNKNOWN':
        default:
          botReply = geminiResponse.reply || 'ขออภัยค่ะ ฉันไม่เข้าใจคำสั่ง ลองใหม่อีกครั้งนะคะ';
          break;
      }

      res.json({ reply: botReply, data: salesData });

    } catch (error) {
      console.error('Error in chatbot API:', error);
      res.status(500).json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาดร้ายแรงในระบบ' });
    }
  });
};